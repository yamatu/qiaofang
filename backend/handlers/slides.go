package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *Handler) CreateSlide(c *gin.Context) {
	var req struct {
		Title       string `json:"title" binding:"required"`
		Subtitle    string `json:"subtitle"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var id int
	err := h.db.QueryRow(
		"INSERT INTO slides (title, subtitle, description, image_url, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id",
		req.Title, req.Subtitle, req.Description, req.ImageURL, req.SortOrder,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateSlide(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Title       string `json:"title"`
		Subtitle    string `json:"subtitle"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
		SortOrder   int    `json:"sort_order"`
		Active      bool   `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, err := h.db.Exec(
		"UPDATE slides SET title=$1, subtitle=$2, description=$3, image_url=$4, sort_order=$5, active=$6 WHERE id=$7",
		req.Title, req.Subtitle, req.Description, req.ImageURL, req.SortOrder, req.Active, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeleteSlide(c *gin.Context) {
	id := c.Param("id")
	_, err := h.db.Exec("DELETE FROM slides WHERE id=$1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *Handler) GetProducts(c *gin.Context) {
	rows, err := h.db.Query("SELECT id, title, category, description, image_url, specs, active, created_at FROM products WHERE active=true ORDER BY id DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var id int
		var title, category, desc, imageURL, specs string
		var active bool
		var createdAt time.Time
		rows.Scan(&id, &title, &category, &desc, &imageURL, &specs, &active, &createdAt)
		items = append(items, gin.H{"id": id, "title": title, "category": category, "description": desc, "image_url": imageURL, "specs": specs, "active": active, "created_at": createdAt})
	}
	c.JSON(http.StatusOK, items)
}

func (h *Handler) GetProduct(c *gin.Context) {
	id := c.Param("id")
	var title, category, desc, imageURL, specs string
	var active bool
	var createdAt time.Time
	err := h.db.QueryRow("SELECT title, category, description, image_url, specs, active, created_at FROM products WHERE id=$1 AND active=true", id).Scan(&title, &category, &desc, &imageURL, &specs, &active, &createdAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": id, "title": title, "category": category, "description": desc, "image_url": imageURL, "specs": specs, "active": active, "created_at": createdAt})
}
