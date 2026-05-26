package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *Handler) CreateNews(c *gin.Context) {
	var req struct {
		Title     string `json:"title" binding:"required"`
		Summary   string `json:"summary"`
		Content   string `json:"content"`
		ImageURL  string `json:"image_url"`
		Published bool   `json:"published"`
	}
	c.ShouldBindJSON(&req)
	var id int
	err := h.db.QueryRow(
		"INSERT INTO news (title, summary, content, image_url, published) VALUES ($1,$2,$3,$4,$5) RETURNING id",
		req.Title, req.Summary, req.Content, req.ImageURL, req.Published,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateNews(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Title     string `json:"title"`
		Summary   string `json:"summary"`
		Content   string `json:"content"`
		ImageURL  string `json:"image_url"`
		Published bool   `json:"published"`
	}
	c.ShouldBindJSON(&req)
	h.db.Exec(
		"UPDATE news SET title=$1, summary=$2, content=$3, image_url=$4, published=$5 WHERE id=$6",
		req.Title, req.Summary, req.Content, req.ImageURL, req.Published, id,
	)
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeleteNews(c *gin.Context) {
	id := c.Param("id")
	h.db.Exec("DELETE FROM news WHERE id=$1", id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *Handler) GetCertificates(c *gin.Context) {
	rows, err := h.db.Query("SELECT id, title, description, image_url, created_at FROM certificates ORDER BY id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var cid int
		var title, desc, imageURL string
		var createdAt time.Time
		rows.Scan(&cid, &title, &desc, &imageURL, &createdAt)
		items = append(items, gin.H{"id": cid, "title": title, "description": desc, "image_url": imageURL, "created_at": createdAt})
	}
	c.JSON(http.StatusOK, items)
}

func (h *Handler) CreateCertificate(c *gin.Context) {
	var req struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
	}
	c.ShouldBindJSON(&req)
	var id int
	h.db.QueryRow("INSERT INTO certificates (title, description, image_url) VALUES ($1,$2,$3) RETURNING id",
		req.Title, req.Description, req.ImageURL).Scan(&id)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateCertificate(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
	}
	c.ShouldBindJSON(&req)
	h.db.Exec("UPDATE certificates SET title=$1, description=$2, image_url=$3 WHERE id=$4",
		req.Title, req.Description, req.ImageURL, id)
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeleteCertificate(c *gin.Context) {
	id := c.Param("id")
	h.db.Exec("DELETE FROM certificates WHERE id=$1", id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
