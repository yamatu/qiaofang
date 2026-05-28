package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetApplications(c *gin.Context) {
	rows, err := h.db.Query("SELECT id, title, description, image_url, sort_order FROM applications ORDER BY sort_order, id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var id, sortOrder int
		var title string
		var desc, imageURL sql.NullString
		if err := rows.Scan(&id, &title, &desc, &imageURL, &sortOrder); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		items = append(items, gin.H{"id": id, "title": title, "description": desc.String, "image_url": imageURL.String, "sort_order": sortOrder})
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
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
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var id int
	if err := h.db.QueryRow("INSERT INTO applications (title, description, image_url, sort_order) VALUES ($1,$2,$3,$4) RETURNING id",
		req.Title, req.Description, req.ImageURL, req.SortOrder).Scan(&id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "created"})
}

func (h *Handler) UpdateApplication(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	res, err := h.db.Exec("UPDATE applications SET title=$1, description=$2, image_url=$3, sort_order=$4 WHERE id=$5",
		req.Title, req.Description, req.ImageURL, req.SortOrder, id)
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

func (h *Handler) DeleteApplication(c *gin.Context) {
	id := c.Param("id")
	res, err := h.db.Exec("DELETE FROM applications WHERE id=$1", id)
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
