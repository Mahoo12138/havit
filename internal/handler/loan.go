package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type LoanHandler struct {
	svc *service.LoanService
}

func NewLoanHandler(svc *service.LoanService) *LoanHandler {
	return &LoanHandler{svc: svc}
}

func (h *LoanHandler) Mount(r chi.Router) {
	r.Post("/items/{id}/loans", h.create)
	r.Get("/items/{id}/loans", h.listForItem)
	r.Post("/loans/{id}/return", h.returnLoan)
	r.Post("/loans/{id}/unreturned", h.markUnreturned)
}

func (h *LoanHandler) create(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	var in service.LoanCreateInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	loan, err := h.svc.Create(r.Context(), itemID, in)
	if err != nil {
		h.writeLoanError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, loan)
}

func (h *LoanHandler) listForItem(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	loans, err := h.svc.ListForItem(r.Context(), itemID)
	if err != nil {
		h.writeLoanError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"loans": loans})
}

func (h *LoanHandler) returnLoan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in service.LoanReturnInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	loan, err := h.svc.Return(r.Context(), id, in)
	if err != nil {
		h.writeLoanError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, loan)
}

func (h *LoanHandler) markUnreturned(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in service.LoanUnreturnedInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	loan, err := h.svc.MarkUnreturned(r.Context(), id, in)
	if err != nil {
		h.writeLoanError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, loan)
}

func (h *LoanHandler) writeLoanError(w http.ResponseWriter, err error) {
	if errors.Is(err, service.ErrNotFound) {
		writeError(w, http.StatusNotFound, err)
		return
	}
	writeError(w, http.StatusBadRequest, err)
}
