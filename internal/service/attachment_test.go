package service

import (
	"bytes"
	"context"
	"errors"
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

func TestAttachmentPrivacyIsolatesPrivateItems(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	seedUser(t, database, "user-alice", "member")
	locID := createTestLocation(t, ctx, database, "书房")
	alice := "user-alice"
	item, err := NewItemService(database).Create(ctxAs(alice), ItemCreateInput{
		Name: "私密相机", Type: model.ItemTypeDurable, LocationID: &locID,
		IsPrivate: true, OwnerID: &alice,
	})
	if err != nil {
		t.Fatalf("create private item: %v", err)
	}
	svc := NewAttachmentService(database, t.TempDir())
	photo, err := svc.Store(ctxAs(alice), StoreAttachmentInput{
		ItemID:      item.ID,
		Type:        model.AttachmentTypePhoto,
		Filename:    "private.jpg",
		ContentType: "image/jpeg",
		Reader:      bytes.NewReader([]byte("fake-jpeg")),
	})
	if err != nil {
		t.Fatalf("store photo: %v", err)
	}

	bob := ctxAs("user-bob")
	if _, err := svc.List(bob, item.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob list attachments: expected ErrNotFound, got %v", err)
	}
	if _, _, err := svc.Open(bob, photo.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob open attachment: expected ErrNotFound, got %v", err)
	}
	if err := svc.Delete(bob, photo.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob delete attachment: expected ErrNotFound, got %v", err)
	}
}
