package handler

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"strings"
	"testing"
	"time"

	"github.com/mahoo12138/havit/internal/service"
)

func setupToken(t *testing.T, router http.Handler) string {
	t.Helper()

	setup := postJSON(t, router, "/api/v1/auth/setup", map[string]string{
		"username": "owner@example.com",
		"password": "secret123",
	})
	if setup.Code != http.StatusCreated {
		t.Fatalf("expected setup 201, got %d: %s", setup.Code, setup.Body.String())
	}
	return tokenFromResponse(t, setup)
}

func authedRequest(method, path, token string, body *strings.Reader) *http.Request {
	var r *http.Request
	if body == nil {
		r = httptest.NewRequest(method, path, nil)
	} else {
		r = httptest.NewRequest(method, path, body)
	}
	r.Header.Set("Authorization", "Bearer "+token)
	return r
}

func decodeJSON(t *testing.T, rec *httptest.ResponseRecorder, out any) {
	t.Helper()

	if err := json.Unmarshal(rec.Body.Bytes(), out); err != nil {
		t.Fatalf("decode json: %v; body=%s", err, rec.Body.String())
	}
}

func TestLocationAndItemHTTPFlow(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	if createLoc.Code != http.StatusCreated {
		t.Fatalf("expected location create 201, got %d: %s", createLoc.Code, createLoc.Body.String())
	}
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)
	if loc.ID == "" {
		t.Fatal("expected location id")
	}

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "备用 HDMI 线",
		"type":        "durable",
		"location_id": loc.ID,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)
	if item.ID == "" {
		t.Fatal("expected item id")
	}

	search := httptest.NewRecorder()
	router.ServeHTTP(search, authedRequest(http.MethodGet, "/api/v1/items/?q=HDMI", token, nil))
	if search.Code != http.StatusOK {
		t.Fatalf("expected search 200, got %d: %s", search.Code, search.Body.String())
	}
	if !bytes.Contains(search.Body.Bytes(), []byte(`备用 HDMI 线`)) {
		t.Fatalf("expected search result to include item, got %s", search.Body.String())
	}

	archive := httptest.NewRecorder()
	router.ServeHTTP(archive, authedRequest(http.MethodDelete, "/api/v1/items/"+item.ID, token, nil))
	if archive.Code != http.StatusNoContent {
		t.Fatalf("expected archive 204, got %d: %s", archive.Code, archive.Body.String())
	}

	list := httptest.NewRecorder()
	router.ServeHTTP(list, authedRequest(http.MethodGet, "/api/v1/items/", token, nil))
	if list.Code != http.StatusOK {
		t.Fatalf("expected list 200, got %d: %s", list.Code, list.Body.String())
	}
	if bytes.Contains(list.Body.Bytes(), []byte(`备用 HDMI 线`)) {
		t.Fatalf("expected archived item to be hidden from default list, got %s", list.Body.String())
	}
}

func TestImportItemsHTTPFlowCreatesRowsAndLocations(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	body := strings.NewReader(strings.Join([]string{
		"name,type,category,location,purchase_price,purchase_date,serial_number",
		"机械键盘,durable,外设,书房/书桌,399.50,2026-06-08,SN-001",
	}, "\n"))
	req := authedRequest(http.MethodPost, "/api/v1/import/items?format=csv", token, body)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected import 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`"created":1`)) {
		t.Fatalf("expected one created row, got %s", rec.Body.String())
	}

	items := httptest.NewRecorder()
	router.ServeHTTP(items, authedRequest(http.MethodGet, "/api/v1/items/?q=机械键盘", token, nil))
	if items.Code != http.StatusOK {
		t.Fatalf("expected items 200, got %d: %s", items.Code, items.Body.String())
	}
	if !bytes.Contains(items.Body.Bytes(), []byte(`机械键盘`)) {
		t.Fatalf("expected imported item in search results, got %s", items.Body.String())
	}

	locations := httptest.NewRecorder()
	router.ServeHTTP(locations, authedRequest(http.MethodGet, "/api/v1/locations/", token, nil))
	if locations.Code != http.StatusOK {
		t.Fatalf("expected locations 200, got %d: %s", locations.Code, locations.Body.String())
	}
	if !bytes.Contains(locations.Body.Bytes(), []byte(`书桌`)) {
		t.Fatalf("expected imported location path, got %s", locations.Body.String())
	}
}

func TestImportItemsReturnsUnprocessableWhenAllRowsFail(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	body := strings.NewReader(strings.Join([]string{
		"name,type,category",
		",durable,外设",
		"未知物品,mystery,杂物",
	}, "\n"))
	req := authedRequest(http.MethodPost, "/api/v1/import/items?format=csv", token, body)
	req.Header.Set("Content-Type", "text/csv; charset=utf-8")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected import 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`"created":0`)) ||
		!bytes.Contains(rec.Body.Bytes(), []byte(`"failed":2`)) {
		t.Fatalf("expected all rows to fail, got %s", rec.Body.String())
	}
}

func TestExportItemsHTTPFlowDownloadsJSONAndCSV(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createTag := postAuthedJSON(t, router, "/api/v1/tags/", token, map[string]string{
		"name":  "摄影",
		"color": "#4a90d9",
	})
	var tag struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createTag, &tag)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":          "Sony A7M4",
		"type":          "tracked_spares",
		"location_id":   loc.ID,
		"serial_number": "SN-A7M4",
		"current_stock": 2,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	body, err := json.Marshal(map[string][]string{"tag_ids": {tag.ID}})
	if err != nil {
		t.Fatalf("marshal tag body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPut, "/api/v1/items/"+item.ID+"/tags", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	assign := httptest.NewRecorder()
	router.ServeHTTP(assign, req)
	if assign.Code != http.StatusOK {
		t.Fatalf("expected assign tags 200, got %d: %s", assign.Code, assign.Body.String())
	}

	jsonExport := httptest.NewRecorder()
	router.ServeHTTP(jsonExport, authedRequest(http.MethodGet, "/api/v1/export/items?format=json", token, nil))
	if jsonExport.Code != http.StatusOK {
		t.Fatalf("expected json export 200, got %d: %s", jsonExport.Code, jsonExport.Body.String())
	}
	if ct := jsonExport.Header().Get("Content-Type"); !strings.Contains(ct, "application/json") {
		t.Fatalf("expected json content type, got %q", ct)
	}
	if !bytes.Contains(jsonExport.Body.Bytes(), []byte(`"name":"Sony A7M4"`)) ||
		!bytes.Contains(jsonExport.Body.Bytes(), []byte(`"location_path":"书房"`)) ||
		!bytes.Contains(jsonExport.Body.Bytes(), []byte(`"current_stock":2`)) ||
		!bytes.Contains(jsonExport.Body.Bytes(), []byte(`"name":"摄影"`)) {
		t.Fatalf("expected exported json to include item, location and tag, got %s", jsonExport.Body.String())
	}

	csvExport := httptest.NewRecorder()
	router.ServeHTTP(csvExport, authedRequest(http.MethodGet, "/api/v1/export/items?format=csv", token, nil))
	if csvExport.Code != http.StatusOK {
		t.Fatalf("expected csv export 200, got %d: %s", csvExport.Code, csvExport.Body.String())
	}
	if ct := csvExport.Header().Get("Content-Type"); !strings.Contains(ct, "text/csv") {
		t.Fatalf("expected csv content type, got %q", ct)
	}
	for _, want := range []string{"name,type,status,category,description,location_id,location_path", "Sony A7M4", "书房", "摄影", ",2,"} {
		if !strings.Contains(csvExport.Body.String(), want) {
			t.Fatalf("expected csv export to include %q, got %s", want, csvExport.Body.String())
		}
	}
}

func TestTrackedSparesUseOneHTTPFlow(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "厨房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":                "净水器滤芯",
		"type":                "tracked_spares",
		"location_id":         loc.ID,
		"current_stock":       1,
		"min_stock_threshold": 1,
		"lifespan_days":       180,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	useOne := httptest.NewRecorder()
	router.ServeHTTP(useOne, authedRequest(http.MethodPost, "/api/v1/items/"+item.ID+"/use-one", token, nil))
	if useOne.Code != http.StatusOK {
		t.Fatalf("expected use-one 200, got %d: %s", useOne.Code, useOne.Body.String())
	}
	if !bytes.Contains(useOne.Body.Bytes(), []byte(`"current_stock":0`)) ||
		!bytes.Contains(useOne.Body.Bytes(), []byte(`"needs_restock":true`)) ||
		!bytes.Contains(useOne.Body.Bytes(), []byte(`"life_expires_at":`)) {
		t.Fatalf("expected stock countdown response, got %s", useOne.Body.String())
	}
}

func TestPredictiveSuppliesPurchaseAndCalibrationHTTPFlow(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "厨房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "咖啡豆",
		"type":        "predictive_supplies",
		"location_id": loc.ID,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	firstAt := int64(1780000000)
	secondAt := firstAt + 14*24*60*60
	first := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/purchase-events", token, map[string]any{
		"quantity":     2,
		"purchased_at": firstAt,
	})
	if first.Code != http.StatusCreated {
		t.Fatalf("expected first purchase event 201, got %d: %s", first.Code, first.Body.String())
	}
	second := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/purchase-events", token, map[string]any{
		"quantity":     1,
		"purchased_at": secondAt,
	})
	if second.Code != http.StatusCreated {
		t.Fatalf("expected second purchase event 201, got %d: %s", second.Code, second.Body.String())
	}

	listPurchases := httptest.NewRecorder()
	router.ServeHTTP(listPurchases, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID+"/purchase-events", token, nil))
	if listPurchases.Code != http.StatusOK {
		t.Fatalf("expected purchase event list 200, got %d: %s", listPurchases.Code, listPurchases.Body.String())
	}
	if !bytes.Contains(listPurchases.Body.Bytes(), []byte(`"purchase_events":[`)) ||
		!bytes.Contains(listPurchases.Body.Bytes(), []byte(`"next_purchase_at":`)) {
		t.Fatalf("expected purchase events and prediction, got %s", listPurchases.Body.String())
	}

	calibration := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/calibration-events", token, map[string]string{
		"signal": "almost_empty",
	})
	if calibration.Code != http.StatusCreated {
		t.Fatalf("expected calibration event 201, got %d: %s", calibration.Code, calibration.Body.String())
	}

	listCalibrations := httptest.NewRecorder()
	router.ServeHTTP(listCalibrations, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID+"/calibration-events", token, nil))
	if listCalibrations.Code != http.StatusOK {
		t.Fatalf("expected calibration event list 200, got %d: %s", listCalibrations.Code, listCalibrations.Body.String())
	}
	if !bytes.Contains(listCalibrations.Body.Bytes(), []byte(`"calibration_events":[`)) ||
		!bytes.Contains(listCalibrations.Body.Bytes(), []byte(`"signal":"almost_empty"`)) {
		t.Fatalf("expected calibration events, got %s", listCalibrations.Body.String())
	}

	jsonExport := httptest.NewRecorder()
	router.ServeHTTP(jsonExport, authedRequest(http.MethodGet, "/api/v1/export/items?format=json", token, nil))
	if jsonExport.Code != http.StatusOK {
		t.Fatalf("expected json export 200, got %d: %s", jsonExport.Code, jsonExport.Body.String())
	}
	if !bytes.Contains(jsonExport.Body.Bytes(), []byte(`"purchase_events":[`)) ||
		!bytes.Contains(jsonExport.Body.Bytes(), []byte(`"calibration_events":[`)) {
		t.Fatalf("expected export to include predictive supplies events, got %s", jsonExport.Body.String())
	}
}

func TestLoanHTTPFlowTracksBorrowReturnAndResponsibilityHandoff(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "备用相机",
		"type":        "durable",
		"location_id": loc.ID,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	loanedAt := int64(1780000000)
	dueAt := loanedAt + 7*24*60*60
	createLoan := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/loans", token, map[string]any{
		"borrower_name":    "小王",
		"borrower_contact": "wx:xiaowang",
		"loaned_at":        loanedAt,
		"due_at":           dueAt,
		"notes":            "带去旅行",
	})
	if createLoan.Code != http.StatusCreated {
		t.Fatalf("expected loan create 201, got %d: %s", createLoan.Code, createLoan.Body.String())
	}
	var loan struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	}
	decodeJSON(t, createLoan, &loan)
	if loan.ID == "" || loan.Status != "active" {
		t.Fatalf("unexpected loan response: %#v", loan)
	}

	getBorrowedItem := httptest.NewRecorder()
	router.ServeHTTP(getBorrowedItem, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID, token, nil))
	if getBorrowedItem.Code != http.StatusOK {
		t.Fatalf("expected get borrowed item 200, got %d: %s", getBorrowedItem.Code, getBorrowedItem.Body.String())
	}
	if !bytes.Contains(getBorrowedItem.Body.Bytes(), []byte(`"status":"borrowed"`)) {
		t.Fatalf("expected borrowed item status, got %s", getBorrowedItem.Body.String())
	}

	listLoans := httptest.NewRecorder()
	router.ServeHTTP(listLoans, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID+"/loans", token, nil))
	if listLoans.Code != http.StatusOK {
		t.Fatalf("expected loan list 200, got %d: %s", listLoans.Code, listLoans.Body.String())
	}
	if !bytes.Contains(listLoans.Body.Bytes(), []byte(`"borrower_name":"小王"`)) {
		t.Fatalf("expected loan list to include borrower, got %s", listLoans.Body.String())
	}

	returnLoan := postAuthedJSON(t, router, "/api/v1/loans/"+loan.ID+"/return", token, map[string]any{
		"returned_at": dueAt - 3600,
	})
	if returnLoan.Code != http.StatusOK {
		t.Fatalf("expected loan return 200, got %d: %s", returnLoan.Code, returnLoan.Body.String())
	}
	if !bytes.Contains(returnLoan.Body.Bytes(), []byte(`"status":"returned"`)) {
		t.Fatalf("expected returned loan status, got %s", returnLoan.Body.String())
	}

	getReturnedItem := httptest.NewRecorder()
	router.ServeHTTP(getReturnedItem, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID, token, nil))
	if !bytes.Contains(getReturnedItem.Body.Bytes(), []byte(`"status":"in_stock"`)) {
		t.Fatalf("expected returned item to be in stock, got %s", getReturnedItem.Body.String())
	}

	secondLoan := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/loans", token, map[string]any{
		"borrower_name": "小李",
	})
	if secondLoan.Code != http.StatusCreated {
		t.Fatalf("expected second loan create 201, got %d: %s", secondLoan.Code, secondLoan.Body.String())
	}
	decodeJSON(t, secondLoan, &loan)

	handoff := postAuthedJSON(t, router, "/api/v1/loans/"+loan.ID+"/unreturned", token, map[string]any{
		"compensation":          1200,
		"compensation_currency": "CNY",
		"notes":                 "对方确认弄丢，已赔偿",
	})
	if handoff.Code != http.StatusOK {
		t.Fatalf("expected responsibility handoff 200, got %d: %s", handoff.Code, handoff.Body.String())
	}
	if !bytes.Contains(handoff.Body.Bytes(), []byte(`"status":"unreturned"`)) ||
		!bytes.Contains(handoff.Body.Bytes(), []byte(`"compensation":1200`)) {
		t.Fatalf("expected unreturned loan with compensation, got %s", handoff.Body.String())
	}

	getUnreturnedItem := httptest.NewRecorder()
	router.ServeHTTP(getUnreturnedItem, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID, token, nil))
	if !bytes.Contains(getUnreturnedItem.Body.Bytes(), []byte(`"status":"unreturned"`)) {
		t.Fatalf("expected item to flow to unreturned, got %s", getUnreturnedItem.Body.String())
	}

	jsonExport := httptest.NewRecorder()
	router.ServeHTTP(jsonExport, authedRequest(http.MethodGet, "/api/v1/export/items?format=json", token, nil))
	if jsonExport.Code != http.StatusOK {
		t.Fatalf("expected json export 200, got %d: %s", jsonExport.Code, jsonExport.Body.String())
	}
	if !bytes.Contains(jsonExport.Body.Bytes(), []byte(`"loans":[`)) ||
		!bytes.Contains(jsonExport.Body.Bytes(), []byte(`"borrower_name":"小李"`)) {
		t.Fatalf("expected export to include loan records, got %s", jsonExport.Body.String())
	}
}

func TestLocationQRCodeHTTPFlowScansContainedItems(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createRoot := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "储藏室",
	})
	var root struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createRoot, &root)

	createBox := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name":      "收纳盒 3",
		"parent_id": root.ID,
		"type":      "container",
	})
	var box struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createBox, &box)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "备用 HDMI 线",
		"type":        "durable",
		"location_id": box.ID,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}

	generate := httptest.NewRecorder()
	router.ServeHTTP(generate, authedRequest(http.MethodPost, "/api/v1/locations/"+root.ID+"/qr-code", token, nil))
	if generate.Code != http.StatusOK {
		t.Fatalf("expected qr code generate 200, got %d: %s", generate.Code, generate.Body.String())
	}
	var loc struct {
		QRCode string `json:"qr_code"`
	}
	decodeJSON(t, generate, &loc)
	if loc.QRCode == "" {
		t.Fatalf("expected qr code in response, got %s", generate.Body.String())
	}

	scan := httptest.NewRecorder()
	router.ServeHTTP(scan, authedRequest(http.MethodGet, "/api/v1/locations/scan/"+loc.QRCode, token, nil))
	if scan.Code != http.StatusOK {
		t.Fatalf("expected qr scan 200, got %d: %s", scan.Code, scan.Body.String())
	}
	if !bytes.Contains(scan.Body.Bytes(), []byte(`"location":`)) ||
		!bytes.Contains(scan.Body.Bytes(), []byte(`备用 HDMI 线`)) {
		t.Fatalf("expected scan result to include location and contained item, got %s", scan.Body.String())
	}
}

func TestEssentialsHTTPFlowSwitchesDynamicStatusAndReturnsHome(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createHome := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "玄关",
	})
	var home struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createHome, &home)

	createAway := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "@随身",
		"type": "virtual",
	})
	var away struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createAway, &away)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":                  "钥匙",
		"type":                  "essentials",
		"location_id":           home.ID,
		"home_base_location_id": home.ID,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected essentials item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	setStatus := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/essentials-status", token, map[string]any{
		"current_status_tag": "@随身",
		"location_id":        away.ID,
	})
	if setStatus.Code != http.StatusOK {
		t.Fatalf("expected set essentials status 200, got %d: %s", setStatus.Code, setStatus.Body.String())
	}
	if !bytes.Contains(setStatus.Body.Bytes(), []byte(`"current_status_tag":"@随身"`)) ||
		!bytes.Contains(setStatus.Body.Bytes(), []byte(`"location_id":"`+away.ID+`"`)) {
		t.Fatalf("expected essentials status response, got %s", setStatus.Body.String())
	}

	returnHome := httptest.NewRecorder()
	router.ServeHTTP(returnHome, authedRequest(http.MethodPost, "/api/v1/items/"+item.ID+"/return-home", token, nil))
	if returnHome.Code != http.StatusOK {
		t.Fatalf("expected return home 200, got %d: %s", returnHome.Code, returnHome.Body.String())
	}
	if bytes.Contains(returnHome.Body.Bytes(), []byte(`current_status_tag`)) ||
		!bytes.Contains(returnHome.Body.Bytes(), []byte(`"location_id":"`+home.ID+`"`)) {
		t.Fatalf("expected essentials item returned home, got %s", returnHome.Body.String())
	}
}

func TestWarrantyHTTPFlowAggregatesExpiringItems(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	expiresAt := time.Now().Add(20 * 24 * time.Hour).Unix()
	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":                "显示器",
		"type":                "durable",
		"location_id":         loc.ID,
		"warranty_expires_at": expiresAt,
		"warranty_contact":    "400-123-456",
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected warranty item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}

	warranty := httptest.NewRecorder()
	router.ServeHTTP(warranty, authedRequest(http.MethodGet, "/api/v1/items/warranty?expiring_days=30", token, nil))
	if warranty.Code != http.StatusOK {
		t.Fatalf("expected warranty list 200, got %d: %s", warranty.Code, warranty.Body.String())
	}
	if !bytes.Contains(warranty.Body.Bytes(), []byte(`显示器`)) ||
		!bytes.Contains(warranty.Body.Bytes(), []byte(`"warranty_contact":"400-123-456"`)) {
		t.Fatalf("expected warranty item in aggregate view, got %s", warranty.Body.String())
	}
}

func TestItemExitHTTPFlowMovesItemToGraveyard(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "旧显示器",
		"type":        "durable",
		"location_id": loc.ID,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	exitDate := int64(1780000000)
	exitItem := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/exit", token, map[string]any{
		"exit_type":     "sold",
		"exit_date":     exitDate,
		"exit_price":    500,
		"exit_currency": "CNY",
		"exit_notes":    "闲鱼售出",
	})
	if exitItem.Code != http.StatusOK {
		t.Fatalf("expected exit item 200, got %d: %s", exitItem.Code, exitItem.Body.String())
	}
	if !bytes.Contains(exitItem.Body.Bytes(), []byte(`"status":"sold"`)) ||
		!bytes.Contains(exitItem.Body.Bytes(), []byte(`"exit_type":"sold"`)) ||
		!bytes.Contains(exitItem.Body.Bytes(), []byte(`"exit_price":500`)) {
		t.Fatalf("expected exit ledger response, got %s", exitItem.Body.String())
	}

	list := httptest.NewRecorder()
	router.ServeHTTP(list, authedRequest(http.MethodGet, "/api/v1/items/", token, nil))
	if bytes.Contains(list.Body.Bytes(), []byte(`旧显示器`)) {
		t.Fatalf("expected exited item hidden from default list, got %s", list.Body.String())
	}

	graveyard := httptest.NewRecorder()
	router.ServeHTTP(graveyard, authedRequest(http.MethodGet, "/api/v1/items/graveyard", token, nil))
	if graveyard.Code != http.StatusOK {
		t.Fatalf("expected graveyard 200, got %d: %s", graveyard.Code, graveyard.Body.String())
	}
	if !bytes.Contains(graveyard.Body.Bytes(), []byte(`旧显示器`)) ||
		!bytes.Contains(graveyard.Body.Bytes(), []byte(`闲鱼售出`)) {
		t.Fatalf("expected exited item in graveyard, got %s", graveyard.Body.String())
	}
}

func TestLossRecordsHTTPFlowListsAbnormalLosses(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":              "被盗相机",
		"type":              "durable",
		"location_id":       loc.ID,
		"purchase_price":    8999,
		"purchase_currency": "CNY",
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	exitDate := int64(1780000000)
	stolen := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/exit", token, map[string]any{
		"exit_type":  "stolen",
		"exit_date":  exitDate,
		"exit_notes": "报案记录待补",
	})
	if stolen.Code != http.StatusOK {
		t.Fatalf("expected stolen exit 200, got %d: %s", stolen.Code, stolen.Body.String())
	}

	records := httptest.NewRecorder()
	router.ServeHTTP(records, authedRequest(http.MethodGet, "/api/v1/items/loss-records?from=1779999999&to=1780000001", token, nil))
	if records.Code != http.StatusOK {
		t.Fatalf("expected loss records 200, got %d: %s", records.Code, records.Body.String())
	}
	if !bytes.Contains(records.Body.Bytes(), []byte(`"loss_records":[`)) ||
		!bytes.Contains(records.Body.Bytes(), []byte(`"name":"被盗相机"`)) ||
		!bytes.Contains(records.Body.Bytes(), []byte(`"status":"stolen"`)) ||
		!bytes.Contains(records.Body.Bytes(), []byte(`"loss_date":1780000000`)) ||
		!bytes.Contains(records.Body.Bytes(), []byte(`"purchase_price":8999`)) ||
		!bytes.Contains(records.Body.Bytes(), []byte(`"purchase_currency":"CNY"`)) {
		t.Fatalf("expected stolen item in loss records, got %s", records.Body.String())
	}

	excluded := httptest.NewRecorder()
	router.ServeHTTP(excluded, authedRequest(http.MethodGet, "/api/v1/items/loss-records?from=1780000001", token, nil))
	if excluded.Code != http.StatusOK {
		t.Fatalf("expected filtered loss records 200, got %d: %s", excluded.Code, excluded.Body.String())
	}
	if !bytes.Contains(excluded.Body.Bytes(), []byte(`"loss_records":[]`)) {
		t.Fatalf("expected filtered empty loss records, got %s", excluded.Body.String())
	}
}

func TestStolenClaimPDFHTTPFlowDownloadsPDF(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":              "Stolen Camera",
		"type":              "durable",
		"location_id":       loc.ID,
		"purchase_price":    8999,
		"purchase_currency": "CNY",
		"serial_number":     "SN-001",
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	exitDate := int64(1780000000)
	exitItem := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/exit", token, map[string]any{
		"exit_type":  "stolen",
		"exit_date":  exitDate,
		"exit_notes": "Police report pending",
	})
	if exitItem.Code != http.StatusOK {
		t.Fatalf("expected stolen exit 200, got %d: %s", exitItem.Code, exitItem.Body.String())
	}

	claim := httptest.NewRecorder()
	router.ServeHTTP(claim, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID+"/claim-pdf", token, nil))
	if claim.Code != http.StatusOK {
		t.Fatalf("expected claim pdf 200, got %d: %s", claim.Code, claim.Body.String())
	}
	if ct := claim.Header().Get("Content-Type"); !strings.Contains(ct, "application/pdf") {
		t.Fatalf("expected pdf content type, got %q", ct)
	}
	if cd := claim.Header().Get("Content-Disposition"); !strings.Contains(cd, "Stolen-Camera-insurance-claim.pdf") {
		t.Fatalf("expected claim filename, got %q", cd)
	}
	if !bytes.HasPrefix(claim.Body.Bytes(), []byte("%PDF-1.4")) ||
		!bytes.Contains(claim.Body.Bytes(), []byte("Name: Stolen Camera")) ||
		!bytes.Contains(claim.Body.Bytes(), []byte("Purchase price: 8999.00 CNY")) ||
		!bytes.Contains(claim.Body.Bytes(), []byte("Serial number / IMEI: SN-001")) {
		t.Fatalf("expected claim pdf content, got %s", claim.Body.String())
	}

	createActive := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "Active Camera",
		"type":        "durable",
		"location_id": loc.ID,
	})
	var active struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createActive, &active)
	rejected := httptest.NewRecorder()
	router.ServeHTTP(rejected, authedRequest(http.MethodGet, "/api/v1/items/"+active.ID+"/claim-pdf", token, nil))
	if rejected.Code != http.StatusBadRequest {
		t.Fatalf("expected non-stolen item rejected, got %d: %s", rejected.Code, rejected.Body.String())
	}
}

func TestVirtualAssetCredentialAndAddonHTTPFlow(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "数字资产",
		"type": "virtual",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "Affinity Photo",
		"type":        "virtual",
		"location_id": loc.ID,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected virtual item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	purchasedAt := int64(1780000000)
	credential := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/virtual-credentials", token, map[string]any{
		"platform":     "Serif",
		"account":      "owner@example.com",
		"order_id":     "ORDER-001",
		"license_key":  "AAAA-BBBB-CCCC",
		"purchased_at": purchasedAt,
		"price":        488,
		"currency":     "CNY",
	})
	if credential.Code != http.StatusCreated {
		t.Fatalf("expected credential create 201, got %d: %s", credential.Code, credential.Body.String())
	}
	if !bytes.Contains(credential.Body.Bytes(), []byte(`"platform":"Serif"`)) ||
		!bytes.Contains(credential.Body.Bytes(), []byte(`"license_key":"AAAA-BBBB-CCCC"`)) {
		t.Fatalf("expected virtual credential response, got %s", credential.Body.String())
	}

	addon := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/virtual-addons", token, map[string]any{
		"name":         "V2 Upgrade",
		"platform":     "Serif",
		"price":        128,
		"currency":     "CNY",
		"purchased_at": purchasedAt + 3600,
	})
	if addon.Code != http.StatusCreated {
		t.Fatalf("expected addon create 201, got %d: %s", addon.Code, addon.Body.String())
	}
	if !bytes.Contains(addon.Body.Bytes(), []byte(`"name":"V2 Upgrade"`)) {
		t.Fatalf("expected addon response, got %s", addon.Body.String())
	}

	listCredentials := httptest.NewRecorder()
	router.ServeHTTP(listCredentials, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID+"/virtual-credentials", token, nil))
	if listCredentials.Code != http.StatusOK {
		t.Fatalf("expected credentials list 200, got %d: %s", listCredentials.Code, listCredentials.Body.String())
	}
	if !bytes.Contains(listCredentials.Body.Bytes(), []byte(`"credentials":[`)) ||
		!bytes.Contains(listCredentials.Body.Bytes(), []byte(`ORDER-001`)) {
		t.Fatalf("expected credential in list, got %s", listCredentials.Body.String())
	}

	listAddons := httptest.NewRecorder()
	router.ServeHTTP(listAddons, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID+"/virtual-addons", token, nil))
	if listAddons.Code != http.StatusOK {
		t.Fatalf("expected addons list 200, got %d: %s", listAddons.Code, listAddons.Body.String())
	}
	if !bytes.Contains(listAddons.Body.Bytes(), []byte(`"addons":[`)) ||
		!bytes.Contains(listAddons.Body.Bytes(), []byte(`V2 Upgrade`)) {
		t.Fatalf("expected addon in list, got %s", listAddons.Body.String())
	}
}

func TestReminderHTTPFlowListsDueAndMarksSent(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "相机",
		"type":        "durable",
		"location_id": loc.ID,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	createLoan := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/loans", token, map[string]any{
		"borrower_name": "小王",
		"due_at":        100,
	})
	if createLoan.Code != http.StatusCreated {
		t.Fatalf("expected loan create 201, got %d: %s", createLoan.Code, createLoan.Body.String())
	}

	listDue := httptest.NewRecorder()
	router.ServeHTTP(listDue, authedRequest(http.MethodGet, "/api/v1/reminders?due_only=true", token, nil))
	if listDue.Code != http.StatusOK {
		t.Fatalf("expected reminders 200, got %d: %s", listDue.Code, listDue.Body.String())
	}
	if !bytes.Contains(listDue.Body.Bytes(), []byte(`"type":"loan_due"`)) {
		t.Fatalf("expected loan_due reminder, got %s", listDue.Body.String())
	}
	var listed struct {
		Reminders []struct {
			ID string `json:"id"`
		} `json:"reminders"`
	}
	decodeJSON(t, listDue, &listed)
	if len(listed.Reminders) != 1 || listed.Reminders[0].ID == "" {
		t.Fatalf("expected one reminder id, got %#v", listed.Reminders)
	}

	markSent := postAuthedJSON(t, router, "/api/v1/reminders/"+listed.Reminders[0].ID+"/sent", token, map[string]any{
		"sent_at": 200,
	})
	if markSent.Code != http.StatusOK {
		t.Fatalf("expected mark sent 200, got %d: %s", markSent.Code, markSent.Body.String())
	}
	if !bytes.Contains(markSent.Body.Bytes(), []byte(`"sent_at":200`)) {
		t.Fatalf("expected sent reminder response, got %s", markSent.Body.String())
	}
}

func TestNotifyHTTPFlowProcessesDueRemindersThroughWebhook(t *testing.T) {
	var received service.NotifyMessage
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := json.NewDecoder(r.Body).Decode(&received); err != nil {
			t.Fatalf("decode webhook body: %v", err)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	router := newAuthTestRouterWithExternalURLs(t, "", server.URL)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "相机",
		"type":        "durable",
		"location_id": loc.ID,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	createLoan := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/loans", token, map[string]any{
		"borrower_name": "小王",
		"due_at":        100,
	})
	if createLoan.Code != http.StatusCreated {
		t.Fatalf("expected loan create 201, got %d: %s", createLoan.Code, createLoan.Body.String())
	}

	process := postAuthedJSON(t, router, "/api/v1/notify/process-due", token, map[string]any{
		"now": 200,
	})
	if process.Code != http.StatusOK {
		t.Fatalf("expected notify process 200, got %d: %s", process.Code, process.Body.String())
	}
	if !bytes.Contains(process.Body.Bytes(), []byte(`"processed":1`)) ||
		!bytes.Contains(process.Body.Bytes(), []byte(`"sent":1`)) {
		t.Fatalf("expected processed notification result, got %s", process.Body.String())
	}
	if received.Type != "loan_due" || received.ItemID != item.ID || received.ReminderID == "" {
		t.Fatalf("unexpected webhook message: %#v", received)
	}

	listDue := httptest.NewRecorder()
	router.ServeHTTP(listDue, authedRequest(http.MethodGet, "/api/v1/reminders?due_only=true", token, nil))
	if !bytes.Contains(listDue.Body.Bytes(), []byte(`"reminders":[]`)) {
		t.Fatalf("expected no due reminders after send, got %s", listDue.Body.String())
	}
}

func TestBackupHTTPFlowRunsManualBackup(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	backup := httptest.NewRecorder()
	router.ServeHTTP(backup, authedRequest(http.MethodPost, "/api/v1/backups/run", token, nil))
	if backup.Code != http.StatusCreated {
		t.Fatalf("expected backup run 201, got %d: %s", backup.Code, backup.Body.String())
	}
	if !bytes.Contains(backup.Body.Bytes(), []byte(`"path":`)) ||
		!bytes.Contains(backup.Body.Bytes(), []byte(`_havit.tar.gz`)) {
		t.Fatalf("expected backup result, got %s", backup.Body.String())
	}
}

func TestSearchSSEHTTPFlowReturnsFTSResultsWithEssentialsHint(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createHome := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "玄关",
	})
	var home struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createHome, &home)

	createAway := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "@随身",
		"type": "virtual",
	})
	var away struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createAway, &away)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":                  "钥匙",
		"type":                  "essentials",
		"location_id":           home.ID,
		"home_base_location_id": home.ID,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	setStatus := postAuthedJSON(t, router, "/api/v1/items/"+item.ID+"/essentials-status", token, map[string]any{
		"current_status_tag": "@随身",
		"location_id":        away.ID,
	})
	if setStatus.Code != http.StatusOK {
		t.Fatalf("expected edc status 200, got %d: %s", setStatus.Code, setStatus.Body.String())
	}

	search := httptest.NewRecorder()
	router.ServeHTTP(search, authedRequest(http.MethodGet, "/api/v1/search?q=钥匙", token, nil))
	if search.Code != http.StatusOK {
		t.Fatalf("expected search 200, got %d: %s", search.Code, search.Body.String())
	}
	if ct := search.Header().Get("Content-Type"); !strings.Contains(ct, "text/event-stream") {
		t.Fatalf("expected SSE content type, got %q", ct)
	}
	if !bytes.Contains(search.Body.Bytes(), []byte("event: fts_results")) ||
		!bytes.Contains(search.Body.Bytes(), []byte(`"name":"钥匙"`)) ||
		!bytes.Contains(search.Body.Bytes(), []byte(`"essentials_hint":"当前状态：@随身；如果不在身上，请检查基准归宿：玄关"`)) ||
		!bytes.Contains(search.Body.Bytes(), []byte("event: done")) {
		t.Fatalf("expected fts SSE result with edc hint, got %s", search.Body.String())
	}
}

func TestBarcodeHTTPFlowReturnsDraftAndFallback(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v2/product/123456.json" {
			_, _ = w.Write([]byte(`{"status":1,"product":{"product_name":"燕麦奶","categories":"饮料"}}`))
			return
		}
		_, _ = w.Write([]byte(`{"status":0}`))
	}))
	defer server.Close()

	router := newAuthTestRouterWithBarcode(t, server.URL)
	token := setupToken(t, router)

	found := httptest.NewRecorder()
	router.ServeHTTP(found, authedRequest(http.MethodGet, "/api/v1/barcode/123456", token, nil))
	if found.Code != http.StatusOK {
		t.Fatalf("expected barcode lookup 200, got %d: %s", found.Code, found.Body.String())
	}
	if !bytes.Contains(found.Body.Bytes(), []byte(`"found":true`)) ||
		!bytes.Contains(found.Body.Bytes(), []byte(`"name":"燕麦奶"`)) {
		t.Fatalf("expected barcode draft, got %s", found.Body.String())
	}

	missing := httptest.NewRecorder()
	router.ServeHTTP(missing, authedRequest(http.MethodGet, "/api/v1/barcode/000", token, nil))
	if missing.Code != http.StatusOK {
		t.Fatalf("expected missing barcode lookup 200, got %d: %s", missing.Code, missing.Body.String())
	}
	if !bytes.Contains(missing.Body.Bytes(), []byte(`"found":false`)) ||
		!bytes.Contains(missing.Body.Bytes(), []byte(`"fallback":"ai_or_manual"`)) {
		t.Fatalf("expected barcode fallback, got %s", missing.Body.String())
	}
}

func TestAIRecognizePhotoStoresOriginalImageAndReturnsManualFallback(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "待识别物品",
		"type":        "durable",
		"location_id": loc.ID,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", `form-data; name="file"; filename="photo.jpg"`)
	header.Set("Content-Type", "image/jpeg")
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("create multipart file: %v", err)
	}
	if _, err := part.Write([]byte("fake image")); err != nil {
		t.Fatalf("write multipart file: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/items/"+item.ID+"/ai-recognize-photo", &body)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected ai recognize 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if !bytes.Contains(rec.Body.Bytes(), []byte(`"fallback":"manual"`)) ||
		!bytes.Contains(rec.Body.Bytes(), []byte(`"is_ai_source":true`)) ||
		!bytes.Contains(rec.Body.Bytes(), []byte(`"draft":{}`)) {
		t.Fatalf("expected manual fallback with ai source attachment, got %s", rec.Body.String())
	}
}

func postAuthedJSON(t *testing.T, router http.Handler, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()

	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(raw))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	return rec
}
