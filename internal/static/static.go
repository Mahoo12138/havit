package static

import (
	"embed"
	"errors"
	"io/fs"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

//go:embed all:dist
var embedded embed.FS

func Mount(r chi.Router) {
	staticFS, err := fs.Sub(embedded, "dist")
	if err != nil {
		// dist not present (dev mode) — skip mount, frontend is served by Vite proxy
		return
	}

	if _, err := fs.Stat(staticFS, "index.html"); err != nil {
		return
	}

	fileServer := http.FileServer(http.FS(staticFS))
	r.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		path := strings.TrimPrefix(req.URL.Path, "/")
		servePath := path
		if path == "" {
			setCacheHeaders(w, "index.html")
			fileServer.ServeHTTP(w, req)
			return
		}
		if _, err := fs.Stat(staticFS, path); errors.Is(err, fs.ErrNotExist) {
			req.URL.Path = "/"
			servePath = "index.html"
		}
		setCacheHeaders(w, servePath)
		fileServer.ServeHTTP(w, req)
	}))
}

func setCacheHeaders(w http.ResponseWriter, path string) {
	if strings.HasPrefix(path, "assets/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		return
	}
	if path == "index.html" || path == "" {
		w.Header().Set("Cache-Control", "no-cache")
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=3600")
}
