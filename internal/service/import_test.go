package service

import (
	"context"
	"strings"
	"testing"
	"time"
)

func TestSplitPathAcceptsSupportedSeparatorsAndTrimsEmptySegments(t *testing.T) {
	got := splitPath("书房 / 书桌 -> 抽屉 > 左侧 →  ")
	want := []string{"书房", "书桌", "抽屉", "左侧"}

	if len(got) != len(want) {
		t.Fatalf("expected %d path segments, got %d: %#v", len(want), len(got), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("segment %d: expected %q, got %q", i, want[i], got[i])
		}
	}
}

func TestParseDateAcceptsSupportedFormats(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want int64
	}{
		{name: "epoch seconds", in: "1717200000", want: 1717200000},
		{name: "date with dashes", in: "2026-06-08", want: time.Date(2026, 6, 8, 0, 0, 0, 0, time.UTC).Unix()},
		{name: "date with slashes", in: "2026/06/08", want: time.Date(2026, 6, 8, 0, 0, 0, 0, time.UTC).Unix()},
		{name: "rfc3339", in: "2026-06-08T12:34:56Z", want: time.Date(2026, 6, 8, 12, 34, 56, 0, time.UTC).Unix()},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseDate(tt.in)
			if err != nil {
				t.Fatalf("parse date: %v", err)
			}
			if got != tt.want {
				t.Fatalf("expected %d, got %d", tt.want, got)
			}
		})
	}
}

func TestParseDateRejectsUnknownFormat(t *testing.T) {
	_, err := parseDate("06-08-2026")
	if err == nil {
		t.Fatal("expected unknown date format to be rejected")
	}
}

func TestImportCSVCreatesValidRowsAndReportsInvalidRows(t *testing.T) {
	ctx := context.Background()
	svc := NewImportService(newTestDB(t))

	body := strings.NewReader(strings.Join([]string{
		"name,type,category,location,purchase_price,purchase_date,serial_number",
		"机械键盘,durable,外设,书房/书桌,399.50,2026-06-08,SN-001",
		",durable,外设,书房,10,2026-06-08,SN-002",
		"未知物品,mystery,杂物,仓库,20,2026-06-08,SN-003",
	}, "\n"))

	res, err := svc.Import(ctx, ImportCSV, body, "")
	if err != nil {
		t.Fatalf("import csv: %v", err)
	}

	if res.Total != 3 {
		t.Fatalf("expected total 3, got %d", res.Total)
	}
	if res.Created != 1 {
		t.Fatalf("expected one created row, got %d", res.Created)
	}
	if res.Failed != 2 {
		t.Fatalf("expected two failed rows, got %d", res.Failed)
	}
	if len(res.Errors) != 2 {
		t.Fatalf("expected two import errors, got %d", len(res.Errors))
	}
	if res.Errors[0].Line != 3 || res.Errors[0].Message != "name required" {
		t.Fatalf("unexpected first error: %#v", res.Errors[0])
	}
	if res.Errors[1].Line != 4 || res.Errors[1].Message != "invalid type: mystery" {
		t.Fatalf("unexpected second error: %#v", res.Errors[1])
	}
}
