package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type VirtualAssetHandler struct {
	svc *service.VirtualAssetService
}

func NewVirtualAssetHandler(svc *service.VirtualAssetService) *VirtualAssetHandler {
	return &VirtualAssetHandler{svc: svc}
}

func (h *VirtualAssetHandler) Mount(r chi.Router) {
	r.Post("/items/{id}/virtual-credentials", h.createCredential)
	r.Get("/items/{id}/virtual-credentials", h.listCredentials)
	r.Post("/items/{id}/virtual-addons", h.createAddon)
	r.Get("/items/{id}/virtual-addons", h.listAddons)
}

func (h *VirtualAssetHandler) createCredential(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	var in service.VirtualCredentialInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	credential, err := h.svc.CreateCredential(r.Context(), itemID, in)
	if err != nil {
		h.writeVirtualError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, credential)
}

func (h *VirtualAssetHandler) listCredentials(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	credentials, err := h.svc.ListCredentials(r.Context(), itemID)
	if err != nil {
		h.writeVirtualError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"credentials": credentials})
}

func (h *VirtualAssetHandler) createAddon(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	var in service.VirtualAddonInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	addon, err := h.svc.CreateAddon(r.Context(), itemID, in)
	if err != nil {
		h.writeVirtualError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, addon)
}

func (h *VirtualAssetHandler) listAddons(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	addons, err := h.svc.ListAddons(r.Context(), itemID)
	if err != nil {
		h.writeVirtualError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"addons": addons})
}

func (h *VirtualAssetHandler) writeVirtualError(w http.ResponseWriter, err error) {
	if errors.Is(err, service.ErrNotFound) {
		writeError(w, http.StatusNotFound, err)
		return
	}
	if errors.Is(err, service.ErrInvalidItemType) {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeError(w, http.StatusBadRequest, err)
}
