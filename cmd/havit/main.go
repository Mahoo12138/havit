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
	havitcrypto "github.com/mahoo12138/havit/internal/crypto"
	"github.com/mahoo12138/havit/internal/db"
	"github.com/mahoo12138/havit/internal/handler"
	authmw "github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
	"github.com/mahoo12138/havit/internal/static"
	"github.com/mahoo12138/havit/internal/system"
)

func main() {
	appCtx, stopApp := context.WithCancel(context.Background())
	defer stopApp()

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

	if err := db.Migrate(appCtx, database); err != nil {
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

	configSvc := config.NewConfigService(database)

	authSvc := service.NewAuthService(
		database,
		cfg.Auth.JWTSecret,
		cfg.Auth.SessionExpireHours,
		state.IsDemo(),
		state.MarkInitialized,
	)
	itemSvc := service.NewItemService(database)
	tagSvc := service.NewTagService(database)
	catSvc := service.NewCategoryService(database)
	locSvc := service.NewLocationService(database)

	fieldCrypto, err := havitcrypto.New(cfg.Auth.JWTSecret)
	if err != nil {
		slog.Error("init field encryption", "err", err)
		os.Exit(1)
	}

	importSvc := service.NewImportService(database)
	exportSvc := service.NewExportService(database, fieldCrypto)
	loanSvc := service.NewLoanService(database)
	virtualAssetSvc := service.NewVirtualAssetService(database, fieldCrypto)
	reminderSvc := service.NewReminderService(database)
	notifyGateway := service.NewHTTPNotifyGateway(configSvc)
	notifySvc := service.NewNotifyService(reminderSvc, notifyGateway)
	backupSvc := service.NewBackupService(database, cfg.Data.Dir, cfg.Backup.KeepDays)
	searchSvc := service.NewSearchService(database)
	barcodeSvc := service.NewBarcodeService("")
	attachmentSvc := service.NewAttachmentService(database, cfg.Data.Dir)
	prefsSvc := service.NewPreferencesService(database)
	abnormalSvc := service.NewAbnormalService(database)
	apiTokenSvc := service.NewAPITokenService(database)

	// AI provider always constructed; provider checks ai.api_key at call time.
	aiProvider := service.NewOpenAIProvider(configSvc)
	aiRecognitionSvc := service.NewAIRecognitionService(attachmentSvc, aiProvider)

	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Compress(5, "text/html", "text/css", "text/javascript", "application/javascript", "application/json", "image/svg+xml"))
	r.Use(chimiddleware.Timeout(30 * time.Second))
	if cfg.Server.CORSOrigins != "" {
		r.Use(authmw.CORS(cfg.Server.CORSOrigins))
	}

	systemH := handler.NewSystemHandler(state)
	authH := handler.NewAuthHandler(authSvc, state)
	userH := handler.NewUserHandler(authSvc)
	settingsH := handler.NewSettingsHandler(configSvc)
	prefsH := handler.NewPreferencesHandler(prefsSvc)
	itemH := handler.NewItemHandler(itemSvc)
	tagH := handler.NewTagHandler(tagSvc)
	catH := handler.NewCategoryHandler(catSvc)
	locH := handler.NewLocationHandler(locSvc)
	importH := handler.NewImportHandler(importSvc)
	exportH := handler.NewExportHandler(exportSvc)
	loanH := handler.NewLoanHandler(loanSvc)
	virtualAssetH := handler.NewVirtualAssetHandler(virtualAssetSvc)
	reminderH := handler.NewReminderHandler(reminderSvc)
	notifyH := handler.NewNotifyHandler(notifySvc)
	backupH := handler.NewBackupHandler(backupSvc)
	abnormalH := handler.NewAbnormalHandler(abnormalSvc)
	apiTokenH := handler.NewAPITokenHandler(apiTokenSvc)
	searchH := handler.NewSearchHandler(searchSvc, aiProvider)
	barcodeH := handler.NewBarcodeHandler(barcodeSvc)
	attachmentH := handler.NewAttachmentHandler(attachmentSvc, cfg.Storage.MaxPhotoSizeMB)
	aiH := handler.NewAIHandler(aiRecognitionSvc, cfg.Storage.MaxPhotoSizeMB)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte("ok"))
		})

		systemH.Mount(r)
		authH.MountPublic(r)

		// Standard JSON routes — 4 MB body limit applies.
		r.Group(func(r chi.Router) {
			r.Use(authmw.Auth(authSvc, apiTokenSvc))
			r.Use(chimiddleware.RequestSize(4 * 1024 * 1024))
			authH.MountProtected(r)
			itemH.Mount(r)
			tagH.Mount(r)
			catH.Mount(r)
			locH.Mount(r)
			exportH.Mount(r)
			loanH.Mount(r)
			virtualAssetH.Mount(r)
			reminderH.Mount(r)
			notifyH.Mount(r)
			backupH.Mount(r)
			abnormalH.Mount(r)
			searchH.Mount(r)
			barcodeH.Mount(r)
			aiH.Mount(r)
			prefsH.Mount(r)
			apiTokenH.Mount(r)
		})

		// Owner-only routes (user management + instance config).
		r.Group(func(r chi.Router) {
			r.Use(authmw.Auth(authSvc, apiTokenSvc))
			r.Use(authmw.RequireOwner)
			r.Use(chimiddleware.RequestSize(4 * 1024 * 1024))
			userH.Mount(r)
			settingsH.Mount(r)
		})

		// Routes that set their own per-route body limits (import 16 MB, attachment streams to disk).
		// Mounted in a separate group so the global 4 MB RequestSize does not apply.
		r.Group(func(r chi.Router) {
			r.Use(authmw.Auth(authSvc, apiTokenSvc))
			importH.Mount(r)
			attachmentH.Mount(r)
		})
	})

	static.Mount(r)

	if cfg.Notify.Enabled || configSvc.GetBool("notify.enabled") {
		notifySvc.StartScheduler(appCtx, 15*time.Minute)
	}
	if cfg.Backup.Enabled {
		backupSvc.StartScheduler(appCtx, cfg.Backup.Cron)
	}

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
	stopApp()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}
