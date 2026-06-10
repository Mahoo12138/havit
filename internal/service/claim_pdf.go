package service

import (
	"bytes"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/mahoo12138/havit/internal/model"
)

var ErrInvalidItemStatus = errors.New("invalid item status")

type ClaimPDF struct {
	Filename string
	Content  []byte
}

func (s *ItemService) StolenClaimPDF(ctx context.Context, id string) (*ClaimPDF, error) {
	item, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if item.Status != model.StatusStolen {
		return nil, ErrInvalidItemStatus
	}
	attachments, err := s.claimAttachments(ctx, id)
	if err != nil {
		return nil, err
	}

	lines := []string{
		"Havit Insurance Claim Evidence",
		"Generated at: " + time.Now().Format(time.RFC3339),
		"",
		"Asset",
		"Name: " + item.Name,
		"Status: " + string(item.Status),
		"Category: " + stringValue(item.Category),
		"Serial number / IMEI: " + stringValue(item.SerialNumber),
		"",
		"Purchase",
		"Purchase price: " + moneyValue(item.PurchasePrice, item.PurchaseCurrency),
		"Purchase date: " + unixDateValue(item.PurchaseDate),
		"Purchase platform: " + stringValue(item.PurchasePlatform),
		"",
		"Incident",
		"Stolen date: " + unixDateValue(item.ExitDate),
		"Notes: " + stringValue(item.ExitNotes),
		"",
		"Evidence attachments",
	}
	if len(attachments) == 0 {
		lines = append(lines, "- No attachment records")
	} else {
		for _, attachment := range attachments {
			lines = append(lines, "- "+attachment)
		}
	}

	content := buildSimplePDF(wrapPDFLines(lines, 86))
	return &ClaimPDF{
		Filename: safeClaimFilename(item.Name) + "-insurance-claim.pdf",
		Content:  content,
	}, nil
}

func (s *ItemService) claimAttachments(ctx context.Context, itemID string) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT filename, content_type, created_at
		FROM attachments
		WHERE item_id = ?
		ORDER BY created_at ASC, id ASC`, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []string{}
	for rows.Next() {
		var filename string
		var contentType sql.NullString
		var createdAt int64
		if err := rows.Scan(&filename, &contentType, &createdAt); err != nil {
			return nil, err
		}
		label := filename
		if contentType.Valid && contentType.String != "" {
			label += " (" + contentType.String + ")"
		}
		if createdAt > 0 {
			label += " uploaded " + time.Unix(createdAt, 0).Format("2006-01-02")
		}
		out = append(out, label)
	}
	return out, rows.Err()
}

func buildSimplePDF(lines []string) []byte {
	var content bytes.Buffer
	content.WriteString("BT\n/F1 18 Tf\n50 790 Td\n")
	content.WriteString("(" + escapePDFText("Havit Insurance Claim Evidence") + ") Tj\n")
	content.WriteString("0 -28 Td\n/F1 11 Tf\n")
	for _, line := range lines[1:] {
		content.WriteString("(" + escapePDFText(line) + ") Tj\n")
		content.WriteString("0 -15 Td\n")
	}
	content.WriteString("ET\n")

	objects := []string{
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
		fmt.Sprintf("<< /Length %d >>\nstream\n%sendstream", content.Len(), content.String()),
	}

	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n")
	offsets := make([]int, 0, len(objects)+1)
	offsets = append(offsets, 0)
	for i, object := range objects {
		offsets = append(offsets, pdf.Len())
		fmt.Fprintf(&pdf, "%d 0 obj\n%s\nendobj\n", i+1, object)
	}
	xrefOffset := pdf.Len()
	fmt.Fprintf(&pdf, "xref\n0 %d\n", len(objects)+1)
	pdf.WriteString("0000000000 65535 f \n")
	for _, offset := range offsets[1:] {
		fmt.Fprintf(&pdf, "%010d 00000 n \n", offset)
	}
	fmt.Fprintf(&pdf, "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", len(objects)+1, xrefOffset)
	return pdf.Bytes()
}

func wrapPDFLines(lines []string, limit int) []string {
	out := []string{}
	for _, line := range lines {
		encoded := asciiSafe(line)
		if limit <= 0 || len(encoded) <= limit {
			out = append(out, encoded)
			continue
		}
		for len(encoded) > limit {
			out = append(out, encoded[:limit])
			encoded = encoded[limit:]
		}
		if encoded != "" {
			out = append(out, encoded)
		}
	}
	return out
}

func escapePDFText(s string) string {
	replacer := strings.NewReplacer(`\`, `\\`, `(`, `\(`, `)`, `\)`)
	return replacer.Replace(asciiSafe(s))
}

func asciiSafe(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r >= 32 && r <= 126 {
			b.WriteRune(r)
			continue
		}
		if r == '\n' || r == '\r' || r == '\t' {
			b.WriteByte(' ')
			continue
		}
		fmt.Fprintf(&b, "\\u%04X", r)
	}
	return b.String()
}

func moneyValue(price *float64, currency *string) string {
	if price == nil {
		return "not recorded"
	}
	if currency == nil || strings.TrimSpace(*currency) == "" {
		return fmt.Sprintf("%.2f", *price)
	}
	return fmt.Sprintf("%.2f %s", *price, strings.TrimSpace(*currency))
}

func stringValue(value *string) string {
	if value == nil || strings.TrimSpace(*value) == "" {
		return "not recorded"
	}
	return strings.TrimSpace(*value)
}

func unixDateValue(value *int64) string {
	if value == nil || *value <= 0 {
		return "not recorded"
	}
	return time.Unix(*value, 0).Format("2006-01-02")
}

func safeClaimFilename(name string) string {
	name = asciiSafe(strings.TrimSpace(name))
	if name == "" {
		return "asset"
	}
	name = strings.Map(func(r rune) rune {
		if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' {
			return r
		}
		if r == '-' || r == '_' {
			return r
		}
		return '-'
	}, name)
	name = strings.Trim(name, "-")
	if name == "" {
		return "asset"
	}
	return name
}
