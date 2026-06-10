package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type SearchHandler struct {
	svc      *service.SearchService
	provider service.AIProvider
}

func NewSearchHandler(svc *service.SearchService, provider service.AIProvider) *SearchHandler {
	return &SearchHandler{svc: svc, provider: provider}
}

func (h *SearchHandler) Mount(r chi.Router) {
	r.Get("/search", h.search)
}

func (h *SearchHandler) search(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")

	results, err := h.svc.FTS(r.Context(), r.URL.Query().Get("q"))
	if err != nil {
		writeSSEEvent(w, "error", map[string]string{"error": err.Error()})
		writeSSEEvent(w, "done", map[string]any{})
		return
	}
	writeSSEEvent(w, "fts_results", results)
	if h.provider != nil {
		filter, err := h.provider.ParseSearchQuery(r.Context(), r.URL.Query().Get("q"))
		if err == nil && filter != nil {
			refined, err := h.svc.Filter(r.Context(), *filter)
			if err == nil {
				writeSSEEvent(w, "llm_results", refined)
			}
		}
	}
	writeSSEEvent(w, "done", map[string]any{})
}

func writeSSEEvent(w http.ResponseWriter, event string, data any) {
	raw, err := json.Marshal(data)
	if err != nil {
		raw = []byte(`{"error":"encode event"}`)
	}
	_, _ = fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, raw)
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}
}
