package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/middleware"
	"github.com/mahoo12138/havit/internal/service"
)

type SearchHandler struct {
	svc      *service.SearchService
	prefs    *service.PreferencesService
	provider service.AIProvider
}

func NewSearchHandler(svc *service.SearchService, prefs *service.PreferencesService, provider service.AIProvider) *SearchHandler {
	return &SearchHandler{svc: svc, prefs: prefs, provider: provider}
}

func (h *SearchHandler) Mount(r chi.Router) {
	r.Get("/search", h.search)
}

func (h *SearchHandler) search(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")

	q := r.URL.Query().Get("q")
	ctx := r.Context()

	// Show-archived-in-search is a per-user preference; it applies to both the
	// fast FTS path and the AI-refined filter path.
	includeArchived := false
	if claims, ok := middleware.ClaimsFrom(ctx); ok && h.prefs != nil {
		if prefs, err := h.prefs.Get(ctx, claims.UserID); err == nil {
			includeArchived = prefs.ShowArchivedInSearch
		}
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	safeWrite := func(event string, data any) {
		mu.Lock()
		defer mu.Unlock()
		writeSSEEvent(w, event, data)
	}

	// FTS goroutine — fast local full-text search.
	wg.Add(1)
	go func() {
		defer wg.Done()
		results, err := h.svc.FTS(ctx, q, includeArchived)
		if err != nil {
			// "search_error" instead of "error": EventSource treats a named
			// "error" event as a built-in connection failure on the client.
			safeWrite("search_error", map[string]string{"error": err.Error()})
			return
		}
		safeWrite("fts_results", results)
	}()

	// LLM goroutine — parse query with AI then run structured filter.
	if h.provider != nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			filter, err := h.provider.ParseSearchQuery(ctx, q)
			if err != nil || filter == nil {
				return
			}
			filter.IncludeArchived = includeArchived
			refined, err := h.svc.Filter(ctx, *filter)
			if err != nil {
				return
			}
			safeWrite("llm_results", refined)
		}()
	}

	wg.Wait()
	safeWrite("done", map[string]any{})
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
