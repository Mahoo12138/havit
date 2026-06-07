package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
)

type ImportHandler struct {
	svc *service.ImportService
}

func NewImportHandler(svc *service.ImportService) *ImportHandler {
	return &ImportHandler{svc: svc}
}

func (h *ImportHandler) Mount(r chi.Router) {
	r.Post("/import/items", h.importItems)
}

func (h *ImportHandler) importItems(w http.ResponseWriter, r *http.Request) {
	format := service.ImportFormat(r.URL.Query().Get("format"))
	if format == "" {
		ct := strings.ToLower(r.Header.Get("Content-Type"))
		switch {
		case strings.Contains(ct, "json"):
			format = service.ImportJSON
		case strings.Contains(ct, "csv"), strings.Contains(ct, "text/plain"):
			format = service.ImportCSV
		default:
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "specify ?format=csv|json or set Content-Type",
			})
			return
		}
	}

	if format != service.ImportCSV && format != service.ImportJSON {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "unsupported format"})
		return
	}

	// Bump per-route limit to 16MB for batch payloads; the global JSON cap is 4MB.
	r.Body = http.MaxBytesReader(w, r.Body, 16*1024*1024)
	defer r.Body.Close()

	var ownerID string
	if claims, ok := middleware.ClaimsFrom(r.Context()); ok {
		ownerID = claims.UserID
	}

	res, err := h.svc.Import(r.Context(), format, r.Body, ownerID)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	status := http.StatusOK
	if res.Created == 0 && res.Failed > 0 {
		status = http.StatusUnprocessableEntity
	}
	writeJSON(w, status, res)
}
