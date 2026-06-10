package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/mahoo12138/havit/internal/model"
)

type AIProvider interface {
	RecognizeItem(ctx context.Context, imageData []byte, contentType string) (*ItemDraft, error)
	ParseSearchQuery(ctx context.Context, query string) (*SearchFilter, error)
}

type AIRecognitionService struct {
	attachments *AttachmentService
	provider    AIProvider
}

func NewAIRecognitionService(attachments *AttachmentService, provider AIProvider) *AIRecognitionService {
	return &AIRecognitionService{attachments: attachments, provider: provider}
}

type RecognizeItemInput struct {
	ItemID      string
	Filename    string
	ContentType string
	Reader      io.Reader
}

type RecognizeItemResult struct {
	Draft            *ItemDraft        `json:"draft"`
	SourceAttachment *model.Attachment `json:"source_attachment"`
	Fallback         string            `json:"fallback,omitempty"`
}

func (s *AIRecognitionService) RecognizeItem(ctx context.Context, in RecognizeItemInput) (*RecognizeItemResult, error) {
	attachment, err := s.attachments.Store(ctx, StoreAttachmentInput{
		ItemID:      in.ItemID,
		Type:        model.AttachmentTypePhoto,
		Filename:    in.Filename,
		ContentType: in.ContentType,
		Reader:      in.Reader,
		IsAISource:  true,
	})
	if err != nil {
		return nil, err
	}

	if s.provider == nil {
		return &RecognizeItemResult{
			Draft:            &ItemDraft{},
			SourceAttachment: attachment,
			Fallback:         "manual",
		}, nil
	}

	_, file, err := s.attachments.Open(ctx, attachment.ID)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	imageData, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}
	draft, err := s.provider.RecognizeItem(ctx, imageData, in.ContentType)
	if err != nil {
		return &RecognizeItemResult{
			Draft:            &ItemDraft{},
			SourceAttachment: attachment,
			Fallback:         "manual",
		}, nil
	}
	if draft == nil {
		draft = &ItemDraft{}
	}
	return &RecognizeItemResult{
		Draft:            draft,
		SourceAttachment: attachment,
	}, nil
}

type OpenAIProviderConfig struct {
	BaseURL        string
	APIKey         string
	Model          string
	VisionModel    string
	TimeoutSeconds int
}

type OpenAIProvider struct {
	client      *http.Client
	baseURL     string
	apiKey      string
	model       string
	visionModel string
}

func NewOpenAIProvider(cfg OpenAIProviderConfig) *OpenAIProvider {
	if cfg.BaseURL == "" {
		cfg.BaseURL = "https://api.openai.com/v1"
	}
	if cfg.Model == "" {
		cfg.Model = "gpt-4o-mini"
	}
	if cfg.VisionModel == "" {
		cfg.VisionModel = cfg.Model
	}
	if cfg.TimeoutSeconds <= 0 {
		cfg.TimeoutSeconds = 10
	}
	return &OpenAIProvider{
		client: &http.Client{
			Timeout: time.Duration(cfg.TimeoutSeconds) * time.Second,
		},
		baseURL:     strings.TrimRight(cfg.BaseURL, "/"),
		apiKey:      cfg.APIKey,
		model:       cfg.Model,
		visionModel: cfg.VisionModel,
	}
}

func (p *OpenAIProvider) RecognizeItem(ctx context.Context, imageData []byte, contentType string) (*ItemDraft, error) {
	if len(imageData) == 0 {
		return nil, errors.New("image data required")
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	raw, err := p.chat(ctx, p.visionModel, []chatMessage{
		{
			Role: "system",
			Content: []chatContent{{
				Type: "text",
				Text: "你是家庭物品管理系统 Havit 的拍照识别器。严格输出 JSON，不输出 Markdown 或解释。无法确定的字段必须为 null，不允许猜测型号后缀、序列号或价格。",
			}},
		},
		{
			Role: "user",
			Content: []chatContent{
				{
					Type: "text",
					Text: `分析图片中的物品，只返回这个 JSON 结构：
{"name": string|null, "category": string|null, "description": string|null}
规则：
1. 只填你能从图片中较确定识别的信息。
2. 精确型号、序列号、购买价格、保修信息不能猜测。
3. 字段不确定时返回 null。`,
				},
				{
					Type: "image_url",
					ImageURL: &chatImageURL{
						URL: "data:" + contentType + ";base64," + base64.StdEncoding.EncodeToString(imageData),
					},
				},
			},
		},
	})
	if err != nil {
		return nil, err
	}

	var draft ItemDraft
	if err := decodeJSONContent(raw, &draft); err != nil {
		return nil, err
	}
	normalizeDraft(&draft)
	return &draft, nil
}

func (p *OpenAIProvider) ParseSearchQuery(ctx context.Context, query string) (*SearchFilter, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return &SearchFilter{}, nil
	}

	raw, err := p.chat(ctx, p.model, []chatMessage{
		{
			Role: "system",
			Content: []chatContent{{
				Type: "text",
				Text: "你是家庭物品管理系统 Havit 的搜索解析器。严格输出 JSON，不输出 Markdown 或解释。无法确定的字段填 null 或空数组。",
			}},
		},
		{
			Role: "user",
			Content: []chatContent{{
				Type: "text",
				Text: fmt.Sprintf(`将用户查询解析为 JSON：
{
  "keywords": [],
  "status": null,
  "type": null,
  "location_hint": null,
  "tags": [],
  "time_filter": {"field": null, "op": null, "value": null, "value2": null},
  "idle_days": null,
  "warranty_expiring_days": null,
  "stock_low": null,
  "sort": null,
  "sort_dir": "desc"
}
允许的 status: in_stock, borrowed, idle, for_sale, sold, given_away, lost, stolen, unreturned, damaged, archived。
允许的 type: durable, consumable_a, consumable_b, edc, virtual。
time_filter.value/value2 使用 Unix 秒。
今天的 Unix 秒是 %d。
用户查询：%q`, time.Now().Unix(), query),
			}},
		},
	})
	if err != nil {
		return nil, err
	}

	var filter SearchFilter
	if err := decodeJSONContent(raw, &filter); err != nil {
		return nil, err
	}
	filter.Normalize()
	return &filter, nil
}

func (p *OpenAIProvider) chat(ctx context.Context, model string, messages []chatMessage) (string, error) {
	reqBody := chatCompletionRequest{
		Model:          model,
		Messages:       messages,
		Temperature:    0,
		ResponseFormat: &responseFormat{Type: "json_object"},
	}
	raw, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.baseURL+"/chat/completions", bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	if p.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+p.apiKey)
	}

	res, err := p.client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusMultipleChoices {
		return "", fmt.Errorf("ai provider status %d", res.StatusCode)
	}

	var out chatCompletionResponse
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return "", err
	}
	if len(out.Choices) == 0 {
		return "", errors.New("ai provider returned no choices")
	}
	content := strings.TrimSpace(out.Choices[0].Message.Content)
	if content == "" {
		return "", errors.New("ai provider returned empty content")
	}
	return content, nil
}

type chatCompletionRequest struct {
	Model          string          `json:"model"`
	Messages       []chatMessage   `json:"messages"`
	Temperature    float64         `json:"temperature"`
	ResponseFormat *responseFormat `json:"response_format,omitempty"`
}

type responseFormat struct {
	Type string `json:"type"`
}

type chatMessage struct {
	Role    string        `json:"role"`
	Content []chatContent `json:"content"`
}

type chatContent struct {
	Type     string        `json:"type"`
	Text     string        `json:"text,omitempty"`
	ImageURL *chatImageURL `json:"image_url,omitempty"`
}

type chatImageURL struct {
	URL string `json:"url"`
}

type chatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func decodeJSONContent(raw string, out any) error {
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "```json")
	raw = strings.TrimPrefix(raw, "```")
	raw = strings.TrimSuffix(raw, "```")
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return errors.New("empty json content")
	}
	return json.Unmarshal([]byte(raw), out)
}

func normalizeDraft(draft *ItemDraft) {
	draft.Name = nonEmptyStringPtr(draft.Name)
	draft.Category = nonEmptyStringPtr(draft.Category)
	draft.Description = nonEmptyStringPtr(draft.Description)
}
