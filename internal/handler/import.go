package handler

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	apperr "github.com/mahoo12138/havit/internal/errors"
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
	r.Post("/import/items/preview", h.previewItems)
	r.Post("/import/items", h.importItems)
}

func (h *ImportHandler) previewItems(w http.ResponseWriter, r *http.Request) {
	opts, err := importOptionsFromRequest(r)
	if err != nil {
		writeError(w, 0, err)
		return
	}

	// Bump per-route limit to 16MB for batch payloads; the global JSON cap is 4MB.
	r.Body = http.MaxBytesReader(w, r.Body, 16*1024*1024)
	defer r.Body.Close()

	ownerID := claimsUserID(r)
	res, err := h.svc.Preview(r.Context(), r.Body, ownerID, opts)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *ImportHandler) importItems(w http.ResponseWriter, r *http.Request) {
	opts, err := importOptionsFromRequest(r)
	if err != nil {
		writeError(w, 0, err)
		return
	}

	// Bump per-route limit to 16MB for batch payloads; the global JSON cap is 4MB.
	r.Body = http.MaxBytesReader(w, r.Body, 16*1024*1024)
	defer r.Body.Close()

	ownerID := claimsUserID(r)
	res, err := h.svc.Import(r.Context(), r.Body, ownerID, opts)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	status := http.StatusOK
	if res.Created == 0 && res.Updated == 0 && res.Failed > 0 {
		status = http.StatusUnprocessableEntity
	}
	writeJSON(w, status, res)
}

// importOptionsFromRequest resolves format (query or Content-Type), the
// duplicate policy and the CSV column mapping from the request.
func importOptionsFromRequest(r *http.Request) (service.ImportOptions, error) {
	format := service.ImportFormat(r.URL.Query().Get("format"))
	if format == "" {
		ct := strings.ToLower(r.Header.Get("Content-Type"))
		switch {
		case strings.Contains(ct, "json"):
			format = service.ImportJSON
		case strings.Contains(ct, "csv"), strings.Contains(ct, "text/plain"):
			format = service.ImportCSV
		default:
			return service.ImportOptions{}, apperr.New(apperr.CodeValidationFailed, "specify ?format=csv|json or set Content-Type", http.StatusBadRequest)
		}
	}
	if format != service.ImportCSV && format != service.ImportJSON {
		return service.ImportOptions{}, apperr.ErrUnsupportedFormat
	}

	onDuplicate := service.OnDuplicate(r.URL.Query().Get("on_duplicate"))
	if onDuplicate == "" {
		onDuplicate = service.OnDuplicateSkip
	}
	switch onDuplicate {
	case service.OnDuplicateSkip, service.OnDuplicateUpdate, service.OnDuplicateAppend:
	default:
		return service.ImportOptions{}, apperr.New(apperr.CodeValidationFailed, "invalid on_duplicate: must be skip|update|append", http.StatusBadRequest)
	}

	mapping := map[string]string{}
	for _, pair := range r.URL.Query()["mapping"] {
		field, col, ok := strings.Cut(pair, ":")
		if !ok || strings.TrimSpace(field) == "" {
			continue
		}
		mapping[field] = col
	}

	return service.ImportOptions{
		Format:      format,
		OnDuplicate: onDuplicate,
		Mapping:     mapping,
	}, nil
}

func claimsUserID(r *http.Request) string {
	if claims, ok := middleware.ClaimsFrom(r.Context()); ok {
		return claims.UserID
	}
	return ""
}
