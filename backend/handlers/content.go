package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type contentSection struct {
	ID         int       `json:"id,omitempty"`
	PageKey    string    `json:"page_key"`
	SectionKey string    `json:"section_key"`
	Title      string    `json:"title"`
	Subtitle   string    `json:"subtitle"`
	Body       string    `json:"body"`
	Items      []string  `json:"items"`
	SortOrder  int       `json:"sort_order"`
	Active     bool      `json:"active"`
	UpdatedAt  time.Time `json:"updated_at,omitempty"`
}

type contentSectionRequest struct {
	PageKey    string   `json:"page_key"`
	SectionKey string   `json:"section_key"`
	Title      string   `json:"title"`
	Subtitle   string   `json:"subtitle"`
	Body       string   `json:"body"`
	Items      []string `json:"items"`
	SortOrder  int      `json:"sort_order"`
	Active     *bool    `json:"active"`
}

type contentSyncPayload struct {
	Version    string           `json:"version"`
	ExportedAt string           `json:"exported_at"`
	Sections   []contentSection `json:"sections"`
}

func (h *Handler) GetContentSections(c *gin.Context) {
	pageKey := strings.TrimSpace(c.Query("page"))
	sections, err := h.fetchContentSections(pageKey, true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sections)
}

func (h *Handler) GetAdminContentSections(c *gin.Context) {
	pageKey := strings.TrimSpace(c.Query("page"))
	sections, err := h.fetchContentSections(pageKey, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sections)
}

func (h *Handler) CreateContentSection(c *gin.Context) {
	var req contentSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	section, err := req.toSection()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	itemsJSON, err := json.Marshal(section.Items)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid items"})
		return
	}

	err = h.db.QueryRow(
		`INSERT INTO content_sections (page_key, section_key, title, subtitle, body, items_json, sort_order, active)
		 VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
		 RETURNING id, updated_at`,
		section.PageKey, section.SectionKey, section.Title, section.Subtitle, section.Body, string(itemsJSON), section.SortOrder, section.Active,
	).Scan(&section.ID, &section.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, section)
}

func (h *Handler) UpdateContentSection(c *gin.Context) {
	var req contentSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	section, err := req.toSection()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	itemsJSON, err := json.Marshal(section.Items)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid items"})
		return
	}

	id := c.Param("id")
	res, err := h.db.Exec(
		`UPDATE content_sections
		 SET page_key=$1, section_key=$2, title=$3, subtitle=$4, body=$5, items_json=$6::jsonb, sort_order=$7, active=$8, updated_at=NOW()
		 WHERE id=$9`,
		section.PageKey, section.SectionKey, section.Title, section.Subtitle, section.Body, string(itemsJSON), section.SortOrder, section.Active, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeleteContentSection(c *gin.Context) {
	id := c.Param("id")
	res, err := h.db.Exec("DELETE FROM content_sections WHERE id=$1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *Handler) ExportContentSections(c *gin.Context) {
	sections, err := h.fetchContentSections("", false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, contentSyncPayload{
		Version:    "qiaofang-content-sections-v1",
		ExportedAt: time.Now().Format(time.RFC3339),
		Sections:   sections,
	})
}

func (h *Handler) ImportContentSections(c *gin.Context) {
	var payload contentSyncPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if payload.Sections == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sections required"})
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM content_sections"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, section := range payload.Sections {
		normalized, err := validateContentSection(section)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		itemsJSON, err := json.Marshal(normalized.Items)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid items"})
			return
		}
		if _, err := tx.Exec(
			`INSERT INTO content_sections (page_key, section_key, title, subtitle, body, items_json, sort_order, active)
			 VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
			 ON CONFLICT (page_key, section_key) DO UPDATE SET
			 title=EXCLUDED.title,
			 subtitle=EXCLUDED.subtitle,
			 body=EXCLUDED.body,
			 items_json=EXCLUDED.items_json,
			 sort_order=EXCLUDED.sort_order,
			 active=EXCLUDED.active,
			 updated_at=NOW()`,
			normalized.PageKey, normalized.SectionKey, normalized.Title, normalized.Subtitle, normalized.Body, string(itemsJSON), normalized.SortOrder, normalized.Active,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "imported", "count": len(payload.Sections)})
}

func (h *Handler) GetSiteData(c *gin.Context) {
	data := gin.H{"exported_at": time.Now().Format(time.RFC3339)}
	queries := map[string]string{
		"company":      "SELECT about_text, phone, email, address, wechat_qr, logo_url, logo_small_url, about_image, hero_image, logo_width, logo_height, about_banner, products_banner, certificates_banner, news_banner, contact_banner FROM company_info LIMIT 1",
		"slides":       "SELECT id, title, subtitle, description, image_url, sort_order, active, created_at FROM slides WHERE active=true ORDER BY sort_order, id",
		"products":     "SELECT id, title, category, description, image_url, specs, active, created_at FROM products WHERE active=true ORDER BY id DESC",
		"news":         "SELECT id, title, summary, content, image_url, published, created_at FROM news WHERE published=true ORDER BY created_at DESC",
		"certificates": "SELECT id, title, description, image_url, created_at FROM certificates ORDER BY id",
		"categories":   "SELECT id, name, sort_order FROM categories ORDER BY sort_order, id",
		"partners":     "SELECT id, name, logo_url, website, sort_order FROM partners ORDER BY sort_order, id",
		"applications": "SELECT id, title, description, image_url, sort_order FROM applications ORDER BY sort_order, id",
	}

	for key, query := range queries {
		rows, err := h.queryRows(query)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "section": key})
			return
		}
		data[key] = rows
	}

	if rows, ok := data["company"].([]map[string]any); ok && len(rows) > 0 {
		if address, ok := rows[0]["address"].(string); ok {
			rows[0]["address"] = normalizeCompanyAddress(address)
		}
	}

	sections, err := h.fetchContentSections("", true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "section": "content_sections"})
		return
	}
	data["content_sections"] = sections

	c.JSON(http.StatusOK, data)
}

func (h *Handler) fetchContentSections(pageKey string, activeOnly bool) ([]contentSection, error) {
	where := []string{}
	args := []any{}
	if pageKey != "" {
		args = append(args, pageKey)
		where = append(where, "page_key=$"+strconv.Itoa(len(args)))
	}
	if activeOnly {
		where = append(where, "active=true")
	}

	query := `SELECT id, page_key, section_key, title, subtitle, body, COALESCE(items_json, '[]'::jsonb)::text, sort_order, active, updated_at FROM content_sections`
	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}
	query += " ORDER BY page_key, sort_order, id"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sections := []contentSection{}
	for rows.Next() {
		var section contentSection
		var itemsRaw string
		if err := rows.Scan(&section.ID, &section.PageKey, &section.SectionKey, &section.Title, &section.Subtitle, &section.Body, &itemsRaw, &section.SortOrder, &section.Active, &section.UpdatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal([]byte(itemsRaw), &section.Items); err != nil {
			section.Items = []string{}
		}
		sections = append(sections, section)
	}
	return sections, rows.Err()
}

func (h *Handler) queryRows(query string, args ...any) ([]map[string]any, error) {
	rows, err := h.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	result := []map[string]any{}
	for rows.Next() {
		values := make([]any, len(columns))
		scanArgs := make([]any, len(columns))
		for i := range values {
			scanArgs[i] = &values[i]
		}
		if err := rows.Scan(scanArgs...); err != nil {
			return nil, err
		}
		row := map[string]any{}
		for i, column := range columns {
			row[column] = normalizeDBValue(values[i])
		}
		result = append(result, row)
	}
	return result, rows.Err()
}

func normalizeDBValue(value any) any {
	switch v := value.(type) {
	case nil:
		return ""
	case []byte:
		return string(v)
	case time.Time:
		return v.Format(time.RFC3339)
	default:
		return v
	}
}

func (req contentSectionRequest) toSection() (contentSection, error) {
	active := true
	if req.Active != nil {
		active = *req.Active
	}
	return validateContentSection(contentSection{
		PageKey:    req.PageKey,
		SectionKey: req.SectionKey,
		Title:      req.Title,
		Subtitle:   req.Subtitle,
		Body:       req.Body,
		Items:      req.Items,
		SortOrder:  req.SortOrder,
		Active:     active,
	})
}

func validateContentSection(section contentSection) (contentSection, error) {
	section.PageKey = cleanContentKey(section.PageKey)
	section.SectionKey = cleanContentKey(section.SectionKey)
	section.Title = strings.TrimSpace(section.Title)
	section.Subtitle = strings.TrimSpace(section.Subtitle)
	section.Body = strings.TrimSpace(section.Body)
	if section.PageKey == "" || section.SectionKey == "" {
		return section, errContent("page_key and section_key are required")
	}
	if len(section.PageKey) > 100 || len(section.SectionKey) > 100 {
		return section, errContent("page_key and section_key must be 100 characters or fewer")
	}
	if section.Title == "" {
		return section, errContent("title is required")
	}
	section.Items = cleanContentItems(section.Items)
	return section, nil
}

func cleanContentKey(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, " ", "_")
	return value
}

func cleanContentItems(items []string) []string {
	cleaned := []string{}
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item != "" {
			cleaned = append(cleaned, item)
		}
	}
	return cleaned
}

type errContent string

func (e errContent) Error() string {
	return string(e)
}
