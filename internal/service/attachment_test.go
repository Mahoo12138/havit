package service

import (
	"bytes"
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/mahoo12138/havit/internal/model"
)

func TestAttachmentServiceStoresPhotoAndMetadata(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	items := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")
	item, err := items.Create(ctx, ItemCreateInput{
		Name:       "相机",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	root := t.TempDir()
	svc := NewAttachmentService(database, root)

	photo, err := svc.Store(ctx, StoreAttachmentInput{
		ItemID:      item.ID,
		Type:        model.AttachmentTypePhoto,
		Filename:    "camera.jpg",
		ContentType: "image/jpeg",
		Reader:      bytes.NewReader([]byte("fake-jpeg")),
	})
	if err != nil {
		t.Fatalf("store photo: %v", err)
	}
	if photo.ID == "" {
		t.Fatal("expected attachment id")
	}
	if photo.URL == "" {
		t.Fatal("expected attachment url")
	}

	stored, err := os.ReadFile(filepath.Join(root, photo.Path))
	if err != nil {
		t.Fatalf("read stored file: %v", err)
	}
	if string(stored) != "fake-jpeg" {
		t.Fatalf("unexpected stored file content: %q", stored)
	}

	list, err := svc.List(ctx, item.ID)
	if err != nil {
		t.Fatalf("list attachments: %v", err)
	}
	if len(list) != 1 || list[0].ID != photo.ID {
		t.Fatalf("expected stored attachment in list, got %#v", list)
	}
}
