package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type purgeRequest struct {
	PurgeEverything bool     `json:"purge_everything"`
	Files           []string `json:"files"`
	Paths           []string `json:"paths"`
}

type cloudflareAuth struct {
	token    string
	key      string
	email    string
	zoneID   string
	zoneName string
}

type cacheConfigRequest struct {
	APIToken   string `json:"api_token"`
	ZoneName   string `json:"zone_name"`
	ZoneID     string `json:"zone_id"`
	ClearToken bool   `json:"clear_token"`
}

func (h *Handler) PurgeCache(c *gin.Context) {
	c.Header("Clear-Site-Data", "\"cache\"")

	var req purgeRequest
	if err := c.ShouldBindJSON(&req); err != nil && err.Error() != "EOF" {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	auth := h.cloudflareAuth()
	if !auth.configured() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "cloudflare credentials are not configured"})
		return
	}

	zoneID, err := h.cloudflareZoneID(auth)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	payload := gin.H{"purge_everything": true}
	if !req.PurgeEverything {
		files := normalizePurgeFiles(req.Files, req.Paths)
		if len(files) > 0 {
			payload = gin.H{"files": files}
		}
	}

	body, _ := json.Marshal(payload)
	httpReq, err := http.NewRequest(http.MethodPost, "https://api.cloudflare.com/client/v4/zones/"+zoneID+"/purge_cache", bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	auth.setHeaders(httpReq)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	var cfResp struct {
		Success bool `json:"success"`
		Errors  []struct {
			Message string `json:"message"`
		} `json:"errors"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&cfResp); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	if !cfResp.Success {
		messages := make([]string, 0, len(cfResp.Errors))
		for _, e := range cfResp.Errors {
			messages = append(messages, e.Message)
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": strings.Join(messages, "; ")})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "cache purged"})
}

func (h *Handler) GetCacheConfig(c *gin.Context) {
	auth := h.cloudflareAuth()
	c.JSON(http.StatusOK, gin.H{
		"token_configured": auth.token != "",
		"token_mask":       maskSecret(auth.token),
		"zone_name":        auth.zoneName,
		"zone_id":          auth.zoneID,
		"using_env_token":  h.setting("cf_api_token") == "" && firstEnv("CF_API_TOKEN", "CLOUDFLARE_API_TOKEN", "CF_Token") != "",
	})
}

func (h *Handler) SaveCacheConfig(c *gin.Context) {
	var req cacheConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ClearToken {
		if err := h.setSetting("cf_api_token", ""); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else if strings.TrimSpace(req.APIToken) != "" {
		if err := h.setSetting("cf_api_token", strings.TrimSpace(req.APIToken)); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if strings.TrimSpace(req.ZoneName) != "" {
		if err := h.setSetting("cf_zone_name", strings.TrimSpace(req.ZoneName)); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	if strings.TrimSpace(req.ZoneID) != "" {
		if err := h.setSetting("cf_zone_id", strings.TrimSpace(req.ZoneID)); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "saved"})
}

func firstEnv(keys ...string) string {
	for _, key := range keys {
		if value := os.Getenv(key); value != "" {
			return value
		}
	}
	return ""
}

func (h *Handler) setting(key string) string {
	var value string
	if err := h.db.QueryRow("SELECT value FROM site_settings WHERE key=$1", key).Scan(&value); err != nil {
		return ""
	}
	return value
}

func (h *Handler) setSetting(key, value string) error {
	_, err := h.db.Exec(`
		INSERT INTO site_settings (key, value, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()
	`, key, value)
	return err
}

func (h *Handler) cloudflareAuth() cloudflareAuth {
	token := h.setting("cf_api_token")
	if token == "" {
		token = firstEnv("CF_API_TOKEN", "CLOUDFLARE_API_TOKEN", "CF_Token")
	}

	zoneID := h.setting("cf_zone_id")
	if zoneID == "" {
		zoneID = firstEnv("CF_ZONE_ID", "CLOUDFLARE_ZONE_ID")
	}

	zoneName := h.setting("cf_zone_name")
	if zoneName == "" {
		zoneName = firstEnv("CF_ZONE_NAME", "CLOUDFLARE_ZONE_NAME")
	}
	if zoneName == "" {
		zoneName = rootDomain(firstEnv("PUBLIC_DOMAIN", "SITE_DOMAIN", "DOMAIN"))
	}
	if zoneName == "" {
		zoneName = "yamatu.xyz"
	}

	return cloudflareAuth{
		token:    token,
		key:      firstEnv("CF_Key", "CF_GLOBAL_API_KEY", "CLOUDFLARE_API_KEY"),
		email:    firstEnv("CF_Email", "CF_API_EMAIL", "CLOUDFLARE_EMAIL"),
		zoneID:   zoneID,
		zoneName: zoneName,
	}
}

func (a cloudflareAuth) configured() bool {
	return a.token != "" || (a.key != "" && a.email != "")
}

func (a cloudflareAuth) setHeaders(req *http.Request) {
	if a.token != "" {
		req.Header.Set("Authorization", "Bearer "+a.token)
		return
	}
	req.Header.Set("X-Auth-Email", a.email)
	req.Header.Set("X-Auth-Key", a.key)
}

func (h *Handler) cloudflareZoneID(auth cloudflareAuth) (string, error) {
	if auth.zoneID != "" {
		return auth.zoneID, nil
	}

	req, err := http.NewRequest(http.MethodGet, "https://api.cloudflare.com/client/v4/zones?name="+auth.zoneName, nil)
	if err != nil {
		return "", err
	}
	auth.setHeaders(req)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var data struct {
		Success bool `json:"success"`
		Result  []struct {
			ID string `json:"id"`
		} `json:"result"`
		Errors []struct {
			Message string `json:"message"`
		} `json:"errors"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", err
	}
	if !data.Success {
		messages := make([]string, 0, len(data.Errors))
		for _, e := range data.Errors {
			messages = append(messages, e.Message)
		}
		return "", fmt.Errorf("cloudflare zone lookup failed: %s", strings.Join(messages, "; "))
	}
	if len(data.Result) == 0 {
		return "", fmt.Errorf("cloudflare zone not found: %s", auth.zoneName)
	}
	if h.setting("cf_zone_id") == "" {
		_ = h.setSetting("cf_zone_id", data.Result[0].ID)
	}
	return data.Result[0].ID, nil
}

func maskSecret(secret string) string {
	if secret == "" {
		return ""
	}
	if len(secret) <= 8 {
		return "****"
	}
	return secret[:4] + "..." + secret[len(secret)-4:]
}

func rootDomain(domain string) string {
	domain = strings.TrimSpace(strings.TrimPrefix(strings.TrimPrefix(domain, "https://"), "http://"))
	domain = strings.Trim(domain, "/")
	parts := strings.Split(domain, ".")
	if len(parts) < 2 {
		return domain
	}
	return strings.Join(parts[len(parts)-2:], ".")
}

func normalizePurgeFiles(files []string, paths []string) []string {
	seen := map[string]bool{}
	add := func(value string) {
		value = strings.TrimSpace(value)
		if value == "" {
			return
		}
		if strings.HasPrefix(value, "http://") || strings.HasPrefix(value, "https://") {
			seen[value] = true
			return
		}
		if !strings.HasPrefix(value, "/") {
			value = "/" + value
		}
		seen["https://qiaofang.yamatu.xyz"+value] = true
	}
	for _, file := range files {
		add(file)
	}
	for _, path := range paths {
		add(path)
	}
	out := make([]string, 0, len(seen))
	for file := range seen {
		out = append(out, file)
	}
	return out
}
