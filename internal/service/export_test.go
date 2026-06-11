package service

import (
	"bytes"
	"context"
	"strings"
	"testing"

	havitcrypto "github.com/mahoo12138/havit/internal/crypto"
	"github.com/mahoo12138/havit/internal/model"
)

func newTestExportService(t *testing.T) (*ExportService, *ItemService) {
	t.Helper()

	db := newTestDB(t)
	crypto, err := havitcrypto.New("test-secret")
	if err != nil {
		t.Fatalf("new crypto: %v", err)
	}

	itemSvc := NewItemService(db)
	exportSvc := NewExportService(db, crypto)

	locID := createTestLocation(t, context.Background(), db, "办公室")
	_, err = itemSvc.Create(context.Background(), ItemCreateInput{
		Name:       "Monitor",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	return exportSvc, itemSvc
}

func TestExportItemsJSON(t *testing.T) {
	ctx := context.Background()
	svc, _ := newTestExportService(t)

	result, err := svc.Items(ctx)
	if err != nil {
		t.Fatalf("Export: %v", err)
	}
	if len(result.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(result.Items))
	}
	if result.Items[0].Name != "Monitor" {
		t.Fatalf("expected 'Monitor', got %s", result.Items[0].Name)
	}
	if result.ExportedAt == 0 {
		t.Fatal("expected exported_at to be set")
	}
}

func TestExportItemsCSV(t *testing.T) {
	items := []ExportItem{
		{
			Name:   "Test Item",
			Type:   "durable",
			Status: "idle",
			CreatedAt: 1000,
			UpdatedAt: 2000,
			IsPrivate: false,
		},
		{
			Name:   "Private Item",
			Type:   "virtual",
			Status: "active",
			Category: strPtr("software"),
			SerialNumber: strPtr("SN-001"),
			CreatedAt: 3000,
			UpdatedAt: 4000,
			IsPrivate: true,
		},
	}

	var buf bytes.Buffer
	err := WriteItemsCSV(&buf, items)
	if err != nil {
		t.Fatalf("WriteItemsCSV: %v", err)
	}

	output := buf.String()
	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) != 3 {
		t.Fatalf("expected 3 lines (header + 2 items), got %d", len(lines))
	}

	if !strings.Contains(lines[0], "name,type,status") {
		t.Fatalf("header should contain name,type,status, got: %s", lines[0])
	}

	if !strings.Contains(lines[1], "Test Item,durable,idle") {
		t.Fatalf("first item row incorrect: %s", lines[1])
	}
	if !strings.Contains(lines[2], "Private Item,virtual,active") {
		t.Fatalf("second item row incorrect: %s", lines[2])
	}
}

func TestExportPtrHelpers(t *testing.T) {
	if stringPtrValue(nil) != "" {
		t.Fatal("stringPtrValue(nil) should be empty")
	}
	s := "hello"
	if stringPtrValue(&s) != "hello" {
		t.Fatal("stringPtrValue should return the string")
	}

	if intPtrValue(nil) != "" {
		t.Fatal("intPtrValue(nil) should be empty")
	}
	var v int64 = 42
	if intPtrValue(&v) != "42" {
		t.Fatal("intPtrValue should format the int")
	}

	if intPtrCSVValue(nil) != "" {
		t.Fatal("intPtrCSVValue(nil) should be empty")
	}
	var n int = 99
	if intPtrCSVValue(&n) != "99" {
		t.Fatal("intPtrCSVValue should format the int")
	}

	if floatPtrValue(nil) != "" {
		t.Fatal("floatPtrValue(nil) should be empty")
	}
	var f float64 = 3.14
	if floatPtrValue(&f) != "3.14" {
		t.Fatalf("floatPtrValue should format float: %s", floatPtrValue(&f))
	}

	if boolValue(true) != "true" || boolValue(false) != "false" {
		t.Fatal("boolValue should return true/false")
	}

	if tagNamesValue(nil) != "" {
		t.Fatal("tagNamesValue(nil) should be empty")
	}
	tags := []*model.Tag{
		{Name: "a"},
		{Name: "b"},
	}
	if tagNamesValue(tags) != "a|b" {
		t.Fatalf("tagNamesValue should join with pipe: %s", tagNamesValue(tags))
	}
}

func TestExportEmptyDB(t *testing.T) {
	ctx := context.Background()
	db := newTestDB(t)
	crypto, _ := havitcrypto.New("test-secret")
	svc := NewExportService(db, crypto)

	result, err := svc.Items(ctx)
	if err != nil {
		t.Fatalf("Export empty: %v", err)
	}
	if len(result.Items) != 0 {
		t.Fatalf("expected 0 items, got %d", len(result.Items))
	}
}
