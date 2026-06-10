package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type BarcodeService struct {
	client           *http.Client
	openFoodFactsURL string
}

func NewBarcodeService(openFoodFactsURL string) *BarcodeService {
	if openFoodFactsURL == "" {
		openFoodFactsURL = "https://world.openfoodfacts.org"
	}
	return &BarcodeService{
		client:           &http.Client{Timeout: 8 * time.Second},
		openFoodFactsURL: strings.TrimRight(openFoodFactsURL, "/"),
	}
}

type BarcodeLookupResult struct {
	Barcode  string     `json:"barcode"`
	Found    bool       `json:"found"`
	Fallback string     `json:"fallback,omitempty"`
	Draft    *ItemDraft `json:"draft,omitempty"`
	Source   string     `json:"source,omitempty"`
}

type ItemDraft struct {
	Name        *string `json:"name,omitempty"`
	Category    *string `json:"category,omitempty"`
	Description *string `json:"description,omitempty"`
}

func (s *BarcodeService) Lookup(ctx context.Context, barcode string) (*BarcodeLookupResult, error) {
	barcode = strings.TrimSpace(barcode)
	if barcode == "" {
		return nil, errors.New("barcode required")
	}

	endpoint := s.openFoodFactsURL + "/api/v2/product/" + url.PathEscape(barcode) + ".json"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	res, err := s.client.Do(req)
	if err != nil {
		return &BarcodeLookupResult{Barcode: barcode, Found: false, Fallback: "ai_or_manual"}, nil
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return &BarcodeLookupResult{Barcode: barcode, Found: false, Fallback: "ai_or_manual"}, nil
	}

	var raw struct {
		Status  int `json:"status"`
		Product struct {
			ProductName string `json:"product_name"`
			GenericName string `json:"generic_name"`
			Brands      string `json:"brands"`
			Categories  string `json:"categories"`
		} `json:"product"`
	}
	if err := json.NewDecoder(res.Body).Decode(&raw); err != nil {
		return nil, err
	}
	if raw.Status != 1 || strings.TrimSpace(raw.Product.ProductName) == "" {
		return &BarcodeLookupResult{Barcode: barcode, Found: false, Fallback: "ai_or_manual"}, nil
	}

	name := strings.TrimSpace(raw.Product.ProductName)
	var category *string
	if raw.Product.Categories != "" {
		value := strings.TrimSpace(strings.Split(raw.Product.Categories, ",")[0])
		category = &value
	}
	var description *string
	parts := []string{}
	if strings.TrimSpace(raw.Product.Brands) != "" {
		parts = append(parts, strings.TrimSpace(raw.Product.Brands))
	}
	if strings.TrimSpace(raw.Product.GenericName) != "" {
		parts = append(parts, strings.TrimSpace(raw.Product.GenericName))
	}
	if len(parts) > 0 {
		value := strings.Join(parts, " / ")
		description = &value
	}
	return &BarcodeLookupResult{
		Barcode: barcode,
		Found:   true,
		Source:  "open_food_facts",
		Draft: &ItemDraft{
			Name:        &name,
			Category:    category,
			Description: description,
		},
	}, nil
}
