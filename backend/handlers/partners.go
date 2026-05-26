package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetPartners(c *gin.Context) {
	rows, _ := h.db.Query("SELECT id, name, logo_url, website, sort_order FROM partners ORDER BY sort_order, id")
	if rows == nil {
		c.JSON(http.StatusOK, []any{})
		return
	}
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var id, sortOrder int
		var name, logoURL, website string
		rows.Scan(&id, &name, &logoURL, &website, &sortOrder)
		items = append(items, gin.H{"id": id, "name": name, "logo_url": logoURL, "website": website, "sort_order": sortOrder})
	}
	c.JSON(http.StatusOK, items)
}

func (h *Handler) CreatePartner(c *gin.Context) {
	var req struct {
		Name      string `json:"name" binding:"required"`
		LogoURL   string `json:"logo_url"`
		Website   string `json:"website"`
		SortOrder int    `json:"sort_order"`
	}
	c.ShouldBindJSON(&req)
	var id int
	h.db.QueryRow("INSERT INTO partners (name, logo_url, website, sort_order) VALUES ($1,$2,$3,$4) RETURNING id", req.Name, req.LogoURL, req.Website, req.SortOrder).Scan(&id)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *Handler) UpdatePartner(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name      string `json:"name"`
		LogoURL   string `json:"logo_url"`
		Website   string `json:"website"`
		SortOrder int    `json:"sort_order"`
	}
	c.ShouldBindJSON(&req)
	h.db.Exec("UPDATE partners SET name=$1, logo_url=$2, website=$3, sort_order=$4 WHERE id=$5", req.Name, req.LogoURL, req.Website, req.SortOrder, id)
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeletePartner(c *gin.Context) {
	id := c.Param("id")
	h.db.Exec("DELETE FROM partners WHERE id=$1", id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
