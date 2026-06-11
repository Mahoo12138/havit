package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	apperr "github.com/mahoo12138/havit/internal/errors"
	"github.com/mahoo12138/havit/internal/model"
	"github.com/mahoo12138/havit/internal/service"
)

type AttachmentHandler struct {
	svc            *service.AttachmentService
	maxPhotoSizeMB int
}

func NewAttachmentHandler(svc *service.AttachmentService, maxPhotoSizeMB int) *AttachmentHandler {
	return &AttachmentHandler{svc: svc, maxPhotoSizeMB: maxPhotoSizeMB}
}

func (h *AttachmentHandler) Mount(r chi.Router) {
	r.Get("/items/{itemID}/attachments", h.listItemAttachments)
	r.Post("/items/{itemID}/photos", h.uploadPhoto)
	r.Get("/attachments/{attachmentID}/content", h.readContent)
	r.Delete("/attachments/{attachmentID}", h.delete)
}

func (h *AttachmentHandler) listItemAttachments(w http.ResponseWriter, r *http.Request) {
	attachments, err := h.svc.List(r.Context(), chi.URLParam(r, "itemID"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"attachments": attachments})
}

func (h *AttachmentHandler) uploadPhoto(w http.ResponseWriter, r *http.Request) {
	limit := int64(h.maxPhotoSizeMB)
	if limit <= 0 {
		limit = 20
	}
	r.Body = http.MaxBytesReader(w, r.Body, limit*1024*1024)
	defer r.Body.Close()

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, 0, apperr.ErrFileRequired)
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	if !strings.HasPrefix(strings.ToLower(contentType), "image/") {
		writeError(w, 0, apperr.ErrImageRequired)
		return
	}

	att, err := h.svc.Store(r.Context(), service.StoreAttachmentInput{
		ItemID:      chi.URLParam(r, "itemID"),
		Type:        model.AttachmentTypePhoto,
		Filename:    header.Filename,
		ContentType: contentType,
		Reader:      file,
	})
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusCreated, att)
}

func (h *AttachmentHandler) readContent(w http.ResponseWriter, r *http.Request) {
	att, file, err := h.svc.Open(r.Context(), chi.URLParam(r, "attachmentID"))
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, http.StatusNotFound, err)
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer file.Close()

	if att.ContentType != "" {
		w.Header().Set("Content-Type", att.ContentType)
	}
	w.Header().Set("Content-Disposition", `inline; filename="`+strings.ReplaceAll(att.Filename, `"`, "")+`"`)
	http.ServeContent(w, r, att.Filename, timeFromUnix(att.CreatedAt), file)
}

func (h *AttachmentHandler) delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "attachmentID")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeError(w, 0, err)
			return
		}
		if errors.Is(err, service.ErrAISourceProtected) {
			writeError(w, 0, err)
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func timeFromUnix(ts int64) time.Time {
	if ts <= 0 {
		return time.Time{}
	}
	return time.Unix(ts, 0)
}
