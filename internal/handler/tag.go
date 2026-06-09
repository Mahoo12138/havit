package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type TagHandler struct {
	svc *service.TagService
}

func NewTagHandler(svc *service.TagService) *TagHandler {
	return &TagHandler{svc: svc}
}

func (h *TagHandler) Mount(r chi.Router) {
	r.Route("/tags", func(r chi.Router) {
		r.Get("/", h.list)
		r.Post("/", h.create)
	})
}

func (h *TagHandler) list(w http.ResponseWriter, r *http.Request) {
	tags, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"tags": tags})
}

func (h *TagHandler) create(w http.ResponseWriter, r *http.Request) {
	var in service.TagCreateInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	tag, err := h.svc.Create(r.Context(), in)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusCreated, tag)
}
