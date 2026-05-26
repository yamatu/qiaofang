package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *Handler) CreateProduct(c *gin.Context) {
	var req struct {
		Title       string `json:"title" binding:"required"`
		Category    string `json:"category"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
		Specs       string `json:"specs"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var id int
	err := h.db.QueryRow(
		"INSERT INTO products (title, category, description, image_url, specs) VALUES ($1,$2,$3,$4,$5) RETURNING id",
		req.Title, req.Category, req.Description, req.ImageURL, req.Specs,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Title       string `json:"title"`
		Category    string `json:"category"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
		Specs       string `json:"specs"`
		Active      bool   `json:"active"`
	}
	c.ShouldBindJSON(&req)
	_, err := h.db.Exec(
		"UPDATE products SET title=$1, category=$2, description=$3, image_url=$4, specs=$5, active=$6 WHERE id=$7",
		req.Title, req.Category, req.Description, req.ImageURL, req.Specs, req.Active, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	h.db.Exec("DELETE FROM products WHERE id=$1", id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *Handler) GetNews(c *gin.Context) {
	rows, err := h.db.Query("SELECT id, title, summary, content, image_url, published, created_at FROM news ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var nid int
		var title, summary, content, imageURL string
		var published bool
		var createdAt time.Time
		rows.Scan(&nid, &title, &summary, &content, &imageURL, &published, &createdAt)
		items = append(items, gin.H{"id": nid, "title": title, "summary": summary, "content": content, "image_url": imageURL, "published": published, "created_at": createdAt})
	}
	c.JSON(http.StatusOK, items)
}

func (h *Handler) GetNewsItem(c *gin.Context) {
	id := c.Param("id")
	var title, summary, content, imageURL string
	var published bool
	var createdAt time.Time
	err := h.db.QueryRow("SELECT title, summary, content, image_url, published, created_at FROM news WHERE id=$1", id).Scan(&title, &summary, &content, &imageURL, &published, &createdAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": id, "title": title, "summary": summary, "content": content, "image_url": imageURL, "published": published, "created_at": createdAt})
}
