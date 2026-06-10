package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	authmw "github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
)

type ItemHandler struct {
	svc *service.ItemService
}

func NewItemHandler(svc *service.ItemService) *ItemHandler {
	return &ItemHandler{svc: svc}
}

func (h *ItemHandler) Mount(r chi.Router) {
	r.Route("/items", func(r chi.Router) {
		r.Get("/", h.list)
		r.Get("/warranty", h.warrantyItems)
		r.Get("/graveyard", h.graveyard)
		r.Get("/loss-records", h.lossRecords)
		r.Post("/", h.create)
		r.Get("/{id}", h.get)
		r.Patch("/{id}", h.update)
		r.Delete("/{id}", h.archive)
		r.Post("/{id}/exit", h.exit)
		r.Get("/{id}/claim-pdf", h.claimPDF)
		r.Post("/{id}/use-one", h.useOne)
		r.Post("/{id}/edc-status", h.setEDCStatus)
		r.Post("/{id}/return-home", h.returnEDCHome)
		r.Get("/{id}/purchase-events", h.listPurchaseEvents)
		r.Post("/{id}/purchase-events", h.createPurchaseEvent)
		r.Get("/{id}/calibration-events", h.listCalibrationEvents)
		r.Post("/{id}/calibration-events", h.createCalibrationEvent)
		r.Put("/{id}/tags", h.replaceTags)
		r.Get("/{id}/events", h.listEvents)
	})
}

func (h *ItemHandler) list(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	items, err := h.svc.List(r.Context(), service.ItemListFilter{
		Query:    q.Get("q"),
		Status:   q.Get("status"),
		Type:     q.Get("type"),
		Location: q.Get("location"),
		Tag:      q.Get("tag"),
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *ItemHandler) warrantyItems(w http.ResponseWriter, r *http.Request) {
	days, _ := strconv.Atoi(r.URL.Query().Get("expiring_days"))
	items, err := h.svc.WarrantyItems(r.Context(), service.WarrantyListFilter{ExpiringDays: days})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *ItemHandler) graveyard(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.Graveyard(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *ItemHandler) lossRecords(w http.ResponseWriter, r *http.Request) {
	var filter service.LossRecordFilter
	if raw := r.URL.Query().Get("from"); raw != "" {
		value, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		filter.From = &value
	}
	if raw := r.URL.Query().Get("to"); raw != "" {
		value, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		filter.To = &value
	}
	records, err := h.svc.LossRecords(r.Context(), filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"loss_records": records})
}

func (h *ItemHandler) create(w http.ResponseWriter, r *http.Request) {
	var in service.ItemCreateInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if claims, ok := authmw.ClaimsFrom(r.Context()); ok && in.OwnerID == nil {
		in.OwnerID = &claims.UserID
	}
	item, err := h.svc.Create(r.Context(), in)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *ItemHandler) get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	item, err := h.svc.Get(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *ItemHandler) update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in service.ItemUpdateInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	item, err := h.svc.Update(r.Context(), id, in)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *ItemHandler) archive(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Archive(r.Context(), id); err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ItemHandler) exit(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in service.ItemExitInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	item, err := h.svc.Exit(r.Context(), id, in)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *ItemHandler) claimPDF(w http.ResponseWriter, r *http.Request) {
	pdf, err := h.svc.StolenClaimPDF(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		if errors.Is(err, service.ErrInvalidItemStatus) {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `attachment; filename="`+pdf.Filename+`"`)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(pdf.Content)
}

func (h *ItemHandler) useOne(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	item, err := h.svc.UseOne(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		if errors.Is(err, service.ErrInvalidItemType) {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *ItemHandler) setEDCStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in service.EDCStatusInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	item, err := h.svc.SetEDCStatus(r.Context(), id, in)
	if err != nil {
		h.writeItemActionError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *ItemHandler) returnEDCHome(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	item, err := h.svc.ReturnEDCHome(r.Context(), id)
	if err != nil {
		h.writeItemActionError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *ItemHandler) createPurchaseEvent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in service.PurchaseEventInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	event, err := h.svc.CreatePurchaseEvent(r.Context(), id, in)
	if err != nil {
		h.writeItemActionError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, event)
}

func (h *ItemHandler) listPurchaseEvents(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	events, nextPurchaseAt, err := h.svc.ListPurchaseEvents(r.Context(), id)
	if err != nil {
		h.writeItemActionError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"purchase_events":  events,
		"next_purchase_at": nextPurchaseAt,
	})
}

func (h *ItemHandler) createCalibrationEvent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in struct {
		Signal string `json:"signal"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	event, err := h.svc.CreateCalibrationEvent(r.Context(), id, in.Signal)
	if err != nil {
		h.writeItemActionError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, event)
}

func (h *ItemHandler) listCalibrationEvents(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	events, err := h.svc.ListCalibrationEvents(r.Context(), id)
	if err != nil {
		h.writeItemActionError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"calibration_events": events})
}

func (h *ItemHandler) replaceTags(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var in struct {
		TagIDs []string `json:"tag_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	item, err := h.svc.ReplaceTags(r.Context(), id, in.TagIDs)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *ItemHandler) listEvents(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	events, err := h.svc.ListEvents(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"events": events})
}

func (h *ItemHandler) writeItemActionError(w http.ResponseWriter, err error) {
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
