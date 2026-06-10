package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type ExportHandler struct {
	svc *service.ExportService
}

func NewExportHandler(svc *service.ExportService) *ExportHandler {
	return &ExportHandler{svc: svc}
}

func (h *ExportHandler) Mount(r chi.Router) {
	r.Get("/export/items", h.exportItems)
}

func (h *ExportHandler) exportItems(w http.ResponseWriter, r *http.Request) {
	format := service.ExportFormat(r.URL.Query().Get("format"))
	if format == "" {
		format = service.ExportJSON
	}
	if format != service.ExportJSON && format != service.ExportCSV {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "unsupported format"})
		return
	}

	data, err := h.svc.Items(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	stamp := time.Now().Format("20060102-150405")
	switch format {
	case service.ExportCSV:
		w.Header().Set("Content-Type", "text/csv; charset=utf-8")
		w.Header().Set("Content-Disposition", `attachment; filename="havit-items-`+stamp+`.csv"`)
		w.WriteHeader(http.StatusOK)
		if err := service.WriteItemsCSV(w, data.Items); err != nil {
			writeError(w, http.StatusInternalServerError, err)
		}
	case service.ExportJSON:
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Content-Disposition", `attachment; filename="havit-items-`+stamp+`.json"`)
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(data); err != nil {
			writeError(w, http.StatusInternalServerError, err)
		}
	}
}
