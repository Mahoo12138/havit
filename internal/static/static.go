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
		if path == "" {
			fileServer.ServeHTTP(w, req)
			return
		}
		if _, err := fs.Stat(staticFS, path); errors.Is(err, fs.ErrNotExist) {
			req.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, req)
	}))
}
