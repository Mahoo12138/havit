package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"github.com/mahoo12138/havit/internal/config"
	"github.com/mahoo12138/havit/internal/db"
	"github.com/mahoo12138/havit/internal/handler"
	authmw "github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
	"github.com/mahoo12138/havit/internal/static"
	"github.com/mahoo12138/havit/internal/system"
)

func main() {
	cfg := config.Load()

	if err := os.MkdirAll(cfg.Data.Dir, 0o755); err != nil {
		slog.Error("create data dir", "err", err)
		os.Exit(1)
	}

	dsn := fmt.Sprintf("file:%s/havit.db?_pragma=busy_timeout(5000)&_pragma=foreign_keys(on)", cfg.Data.Dir)
	database, err := db.Open(dsn)
	if err != nil {
		slog.Error("open db", "err", err)
		os.Exit(1)
	}
	defer database.Close()

	if err := db.Migrate(database); err != nil {
		slog.Error("migrate", "err", err)
		os.Exit(1)
	}

	if err := db.InitDemoDataIfNeeded(context.Background(), database, cfg.Mode); err != nil {
		slog.Error("demo init", "err", err)
		os.Exit(1)
	}

	state := system.NewState(cfg.Mode, database)
	slog.Info("startup",
		"mode", state.Mode(),
		"needs_setup", state.NeedsSetup(),
		"version", system.Version,
	)

	authSvc := service.NewAuthService(
		database,
		cfg.Auth.JWTSecret,
		cfg.Auth.SessionExpireHours,
		state.IsDemo(),
		state.MarkInitialized,
	)
	itemSvc := service.NewItemService(database)
	locSvc := service.NewLocationService(database)
	importSvc := service.NewImportService(database)
	attachmentSvc := service.NewAttachmentService(database, cfg.Data.Dir)

	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))

	systemH := handler.NewSystemHandler(state)
	authH := handler.NewAuthHandler(authSvc, state)
	itemH := handler.NewItemHandler(itemSvc)
	locH := handler.NewLocationHandler(locSvc)
	importH := handler.NewImportHandler(importSvc)
	attachmentH := handler.NewAttachmentHandler(attachmentSvc, cfg.Storage.MaxPhotoSizeMB)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("ok"))
		})

		systemH.Mount(r)
		authH.MountPublic(r)

		r.Group(func(r chi.Router) {
			r.Use(authmw.Auth(authSvc))
			authH.MountProtected(r)
			// Import gets its own larger body limit set in handler.
			importH.Mount(r)
			// Attachment upload gets its own body limit and streams to disk.
			attachmentH.Mount(r)
		})

		r.Group(func(r chi.Router) {
			r.Use(authmw.Auth(authSvc))
			r.Use(chimiddleware.RequestSize(4 * 1024 * 1024))
			itemH.Mount(r)
			locH.Mount(r)
		})
	})

	static.Mount(r)

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		slog.Info("starting", "port", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("listen", "err", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	slog.Info("shutting down")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}
