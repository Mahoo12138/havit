package handler

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"strings"
	"testing"

	"github.com/mahoo12138/havit/internal/service"
)

func TestRecognizeDraftPhotoRejectsInvalidUploads(t *testing.T) {
	tests := []struct {
		name       string
		upload     *multipartUpload
		wantStatus int
	}{
		{
			name:       "missing file",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "empty image",
			upload:     newMultipartUpload(t, "empty.png", "image/png", nil),
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "non image",
			upload:     newMultipartUpload(t, "note.txt", "text/plain", []byte("not an image")),
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "too large",
			upload:     newMultipartUpload(t, "large.png", "image/png", []byte(strings.Repeat("x", 2*1024*1024))),
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			database := newAuthTestDB(t)
			attachmentSvc := service.NewAttachmentService(database, t.TempDir())
			handler := NewAIHandler(service.NewAIRecognitionService(attachmentSvc, nil), 1)

			body := bytes.NewBuffer(nil)
			if tt.upload != nil {
				body = tt.upload.body
			}
			req := httptest.NewRequest(http.MethodPost, "/api/v1/ai/recognize-photo", body)
			if tt.upload != nil {
				req.Header.Set("Content-Type", tt.upload.contentType)
			}
			rec := httptest.NewRecorder()
			handler.recognizeDraftPhoto(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("expected status %d, got %d: %s", tt.wantStatus, rec.Code, rec.Body.String())
			}
		})
	}
}

type multipartUpload struct {
	body        *bytes.Buffer
	contentType string
}

func newMultipartUpload(t *testing.T, filename, contentType string, content []byte) *multipartUpload {
	t.Helper()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", `form-data; name="file"; filename="`+filename+`"`)
	header.Set("Content-Type", contentType)
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("create form part: %v", err)
	}
	if _, err := part.Write(content); err != nil {
		t.Fatalf("write form part: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}
	return &multipartUpload{body: body, contentType: writer.FormDataContentType()}
}
