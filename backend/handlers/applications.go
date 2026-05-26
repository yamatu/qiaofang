package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetApplications(c *gin.Context) {
	rows, _ := h.db.Query("SELECT id, title, description, image_url, sort_order FROM applications ORDER BY sort_order, id")
	if rows == nil {
		c.JSON(http.StatusOK, []any{})
		return
	}
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var id, sortOrder int
		var title, desc, imageURL string
		rows.Scan(&id, &title, &desc, &imageURL, &sortOrder)
		items = append(items, gin.H{"id": id, "title": title, "description": desc, "image_url": imageURL, "sort_order": sortOrder})
	}
	c.JSON(http.StatusOK, items)
}

func (h *Handler) CreateApplication(c *gin.Context) {
	var req struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
		SortOrder   int    `json:"sort_order"`
	}
	c.ShouldBindJSON(&req)
	var id int
	h.db.QueryRow("INSERT INTO applications (title, description, image_url, sort_order) VALUES ($1,$2,$3,$4) RETURNING id",
		req.Title, req.Description, req.ImageURL, req.SortOrder).Scan(&id)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateApplication(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
		SortOrder   int    `json:"sort_order"`
	}
	c.ShouldBindJSON(&req)
	h.db.Exec("UPDATE applications SET title=$1, description=$2, image_url=$3, sort_order=$4 WHERE id=$5",
		req.Title, req.Description, req.ImageURL, req.SortOrder, id)
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeleteApplication(c *gin.Context) {
	id := c.Param("id")
	h.db.Exec("DELETE FROM applications WHERE id=$1", id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
