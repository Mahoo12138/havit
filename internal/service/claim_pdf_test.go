package service

import (
	"bytes"
	"context"
	"strings"
	"testing"

	"github.com/mahoo12138/havit/internal/model"
)

func TestStolenClaimPDFIncludesAssetLedgerAndAttachments(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	attachments := NewAttachmentService(database, t.TempDir())
	locID := createTestLocation(t, ctx, database, "书房")

	price := 8999.0
	currency := "CNY"
	serial := "SN-001"
	item, err := svc.Create(ctx, ItemCreateInput{
		Name:             "Stolen Camera",
		Type:             model.ItemTypeDurable,
		LocationID:       &locID,
		PurchasePrice:    &price,
		PurchaseCurrency: &currency,
		SerialNumber:     &serial,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	if _, err := attachments.Store(ctx, StoreAttachmentInput{
		ItemID:      item.ID,
		Type:        model.AttachmentTypePhoto,
		Filename:    "invoice.jpg",
		ContentType: "image/jpeg",
		Reader:      strings.NewReader("invoice"),
	}); err != nil {
		t.Fatalf("store attachment: %v", err)
	}
	notes := "Police report pending"
	if _, err := svc.Exit(ctx, item.ID, ItemExitInput{
		ExitType:  "stolen",
		ExitDate:  1780000000,
		ExitNotes: &notes,
	}); err != nil {
		t.Fatalf("mark stolen: %v", err)
	}

	pdf, err := svc.StolenClaimPDF(ctx, item.ID)
	if err != nil {
		t.Fatalf("claim pdf: %v", err)
	}
	if pdf.Filename != "Stolen-Camera-insurance-claim.pdf" {
		t.Fatalf("unexpected filename %q", pdf.Filename)
	}
	if !bytes.HasPrefix(pdf.Content, []byte("%PDF-1.4")) {
		t.Fatalf("expected PDF header, got %q", pdf.Content[:8])
	}
	for _, want := range []string{
		"Havit Insurance Claim Evidence",
		"Name: Stolen Camera",
		"Serial number / IMEI: SN-001",
		"Purchase price: 8999.00 CNY",
		"Stolen date: 2026-05-29",
		"invoice.jpg (image/jpeg)",
	} {
		if !bytes.Contains(pdf.Content, []byte(want)) {
			t.Fatalf("expected PDF to include %q, got %s", want, string(pdf.Content))
		}
	}
}

func TestStolenClaimPDFRejectsNonStolenItems(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	svc := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")

	item, err := svc.Create(ctx, ItemCreateInput{
		Name:       "Camera",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	_, err = svc.StolenClaimPDF(ctx, item.ID)
	if err != ErrInvalidItemStatus {
		t.Fatalf("expected invalid status error, got %v", err)
	}
}
