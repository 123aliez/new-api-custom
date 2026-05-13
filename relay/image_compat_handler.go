
package relay

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/logger"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/relay/helper"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/types"
	"github.com/samber/lo"

	"github.com/gin-gonic/gin"
)

// chatCompletionsViaImageGeneration handles image generation models called via
// /v1/chat/completions by converting the chat request to an image generation
// request, forwarding to the upstream /v1/images/generations endpoint, and
// wrapping the result back into a chat completions response.
// Supports both stream and non-stream modes.
func chatCompletionsViaImageGeneration(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) *types.NewAPIError {
	wantStream := lo.FromPtrOr(request.Stream, false)

	prompt := extractPromptFromMessages(request.Messages)
	if prompt == "" {
		return types.NewErrorWithStatusCode(
			fmt.Errorf("no text content found in messages for image generation"),
			types.ErrorCodeInvalidRequest, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
	}

	imageReq := &dto.ImageRequest{
		Model:  request.Model,
		Prompt: prompt,
		N:      common.GetPointer(uint(1)),
		Size:   "1024x1024",
	}

	info.RelayMode = relayconstant.RelayModeImagesGenerations
	info.RequestURLPath = "/v1/images/generations"
	info.RelayFormat = types.RelayFormatOpenAIImage
	info.IsStream = false
	info.Request = imageReq
	info.InitChannelMeta(c)

	adaptor := GetAdaptor(info.ApiType)
	if adaptor == nil {
		return types.NewError(fmt.Errorf("invalid api type: %d", info.ApiType), types.ErrorCodeInvalidApiType, types.ErrOptionWithSkipRetry())
	}
	adaptor.Init(info)

	err := helper.ModelMappedHelper(c, info, imageReq)
	if err != nil {
		return types.NewError(err, types.ErrorCodeChannelModelMappedError, types.ErrOptionWithSkipRetry())
	}

	convertedRequest, err := adaptor.ConvertImageRequest(c, info, *imageReq)
	if err != nil {
		return types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
	}

	var requestBody io.Reader
	switch v := convertedRequest.(type) {
	case *bytes.Buffer:
		requestBody = v
	default:
		jsonData, err := common.Marshal(convertedRequest)
		if err != nil {
			return types.NewError(err, types.ErrorCodeJsonMarshalFailed, types.ErrOptionWithSkipRetry())
		}
		if common.DebugEnabled {
			logger.LogDebug(c, fmt.Sprintf("image compat request body: %s", string(jsonData)))
		}
		requestBody = bytes.NewBuffer(jsonData)
	}

	resp, err := adaptor.DoRequest(c, info, requestBody)
	if err != nil {
		return types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)
	}

	var httpResp *http.Response
	if resp != nil {
		httpResp = resp.(*http.Response)
		if httpResp.StatusCode != http.StatusOK {
			newAPIError := service.RelayErrorHandler(c.Request.Context(), httpResp, false)
			return newAPIError
		}
	}

	defer httpResp.Body.Close()
	body, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return types.NewError(fmt.Errorf("failed to read image response: %w", err), types.ErrorCodeDoRequestFailed)
	}

	var imageResp dto.ImageResponse
	if err := json.Unmarshal(body, &imageResp); err != nil {
		return types.NewError(fmt.Errorf("failed to parse image response: %w", err), types.ErrorCodeDoRequestFailed)
	}

	content := buildChatContentFromImageResponse(&imageResp)
	respID := fmt.Sprintf("chatcmpl-img-%d", time.Now().UnixNano())
	created := time.Now().Unix()

	usage := &dto.Usage{PromptTokens: 1, TotalTokens: 1}
	imageN := uint(1)
	if imageReq.N != nil {
		imageN = *imageReq.N
	}
	info.PriceData.AddOtherRatio("n", float64(imageN))

	var logContent []string
	if len(imageReq.Size) > 0 {
		logContent = append(logContent, fmt.Sprintf("大小 %s", imageReq.Size))
	}
	if len(imageReq.Quality) > 0 {
		logContent = append(logContent, fmt.Sprintf("品质 %s", imageReq.Quality))
	}
	if imageN > 0 {
		logContent = append(logContent, fmt.Sprintf("生成数量 %d", imageN))
	}
	logContent = append(logContent, "(via chat completions)")
	service.PostTextConsumeQuota(c, info, usage, logContent)

	if wantStream {
		return sendStreamImageResponse(c, respID, created, request.Model, content)
	}

	c.JSON(http.StatusOK, gin.H{
		"id": respID, "object": "chat.completion", "created": created, "model": request.Model,
		"choices": []gin.H{{"index": 0, "message": gin.H{"role": "assistant", "content": content}, "finish_reason": "stop"}},
		"usage":   gin.H{"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
	})
	return nil
}

func sendStreamImageResponse(c *gin.Context, id string, created int64, model string, content string) *types.NewAPIError {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")
	writeSSEChunk(c, id, created, model, gin.H{"role": "assistant", "content": ""}, nil)
	writeSSEChunk(c, id, created, model, gin.H{"content": content}, nil)
	finishReason := "stop"
	writeSSEChunk(c, id, created, model, nil, &finishReason)
	fmt.Fprintf(c.Writer, "data: [DONE]\n\n")
	c.Writer.Flush()
	return nil
}

func writeSSEChunk(c *gin.Context, id string, created int64, model string, delta gin.H, finishReason *string) {
	chunk := gin.H{
		"id": id, "object": "chat.completion.chunk", "created": created, "model": model,
		"choices": []gin.H{{"index": 0, "delta": delta, "finish_reason": finishReason}},
	}
	data, _ := json.Marshal(chunk)
	fmt.Fprintf(c.Writer, "data: %s\n\n", data)
	c.Writer.Flush()
}

func extractPromptFromMessages(messages []dto.Message) string {
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
		if msg.Role != "user" { continue }
		if msg.IsStringContent() {
			if text := strings.TrimSpace(msg.StringContent()); text != "" { return text }
		}
		contents := msg.ParseContent()
		var parts []string
		for _, c := range contents {
			if c.Type == dto.ContentTypeText && c.Text != "" { parts = append(parts, c.Text) }
		}
		if len(parts) > 0 { return strings.Join(parts, " ") }
	}
	return ""
}

func buildChatContentFromImageResponse(resp *dto.ImageResponse) string {
	if len(resp.Data) == 0 { return "Image generation failed: no images returned." }
	var parts []string
	for i, img := range resp.Data {
		if img.Url != "" {
			parts = append(parts, fmt.Sprintf("![image_%d](%s)", i+1, img.Url))
		} else if img.B64Json != "" {
			parts = append(parts, fmt.Sprintf("![image_%d](data:image/png;base64,%s)", i+1, img.B64Json))
		}
		if img.RevisedPrompt != "" {
			parts = append(parts, fmt.Sprintf("*Revised prompt: %s*", img.RevisedPrompt))
		}
	}
	if len(parts) == 0 { return "Image generation completed but no displayable content." }
	return strings.Join(parts, "\n\n")
}

