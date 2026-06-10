package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type BarcodeHandler struct {
	svc *service.BarcodeService
}

func NewBarcodeHandler(svc *service.BarcodeService) *BarcodeHandler {
	return &BarcodeHandler{svc: svc}
}

func (h *BarcodeHandler) Mount(r chi.Router) {
	r.Get("/barcode/{code}", h.lookup)
}

func (h *BarcodeHandler) lookup(w http.ResponseWriter, r *http.Request) {
	result, err := h.svc.Lookup(r.Context(), chi.URLParam(r, "code"))
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
