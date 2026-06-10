package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type AIHandler struct {
	svc            *service.AIRecognitionService
	maxPhotoSizeMB int
}

func NewAIHandler(svc *service.AIRecognitionService, maxPhotoSizeMB int) *AIHandler {
	return &AIHandler{svc: svc, maxPhotoSizeMB: maxPhotoSizeMB}
}

func (h *AIHandler) Mount(r chi.Router) {
	r.Post("/items/{itemID}/ai-recognize-photo", h.recognizeItemPhoto)
}

func (h *AIHandler) recognizeItemPhoto(w http.ResponseWriter, r *http.Request) {
	limit := int64(h.maxPhotoSizeMB)
	if limit <= 0 {
		limit = 20
	}
	r.Body = http.MaxBytesReader(w, r.Body, limit*1024*1024)
	defer r.Body.Close()

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "file required"})
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	if !strings.HasPrefix(strings.ToLower(contentType), "image/") {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "photo must be an image"})
		return
	}

	result, err := h.svc.RecognizeItem(r.Context(), service.RecognizeItemInput{
		ItemID:      chi.URLParam(r, "itemID"),
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
	writeJSON(w, http.StatusOK, result)
}
