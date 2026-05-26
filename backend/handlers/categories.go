package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetCategories(c *gin.Context) {
	rows, _ := h.db.Query("SELECT id, name, sort_order FROM categories ORDER BY sort_order, id")
	if rows == nil {
		c.JSON(http.StatusOK, []any{})
		return
	}
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var id, sortOrder int
		var name string
		rows.Scan(&id, &name, &sortOrder)
		items = append(items, gin.H{"id": id, "name": name, "sort_order": sortOrder})
	}
	c.JSON(http.StatusOK, items)
}

func (h *Handler) CreateCategory(c *gin.Context) {
	var req struct {
		Name      string `json:"name" binding:"required"`
		SortOrder int    `json:"sort_order"`
	}
	c.ShouldBindJSON(&req)
	var id int
	h.db.QueryRow("INSERT INTO categories (name, sort_order) VALUES ($1,$2) RETURNING id", req.Name, req.SortOrder).Scan(&id)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name      string `json:"name"`
		SortOrder int    `json:"sort_order"`
	}
	c.ShouldBindJSON(&req)
	h.db.Exec("UPDATE categories SET name=$1, sort_order=$2 WHERE id=$3", req.Name, req.SortOrder, id)
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	h.db.Exec("DELETE FROM categories WHERE id=$1", id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
