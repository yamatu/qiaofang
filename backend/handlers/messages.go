package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *Handler) CreateMessage(c *gin.Context) {
	var req struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Phone   string `json:"phone"`
		Company string `json:"company"`
		Message string `json:"message"`
	}
	c.ShouldBindJSON(&req)
	h.db.Exec(
		"INSERT INTO messages (name, email, phone, company, message) VALUES ($1,$2,$3,$4,$5)",
		req.Name, req.Email, req.Phone, req.Company, req.Message,
	)
	c.JSON(http.StatusOK, gin.H{"message": "received"})
}

func (h *Handler) GetMessages(c *gin.Context) {
	rows, err := h.db.Query("SELECT id, name, email, phone, company, message, read, created_at FROM messages ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var id int
		var name, email, phone, company, message string
		var read bool
		var createdAt time.Time
		rows.Scan(&id, &name, &email, &phone, &company, &message, &read, &createdAt)
		items = append(items, gin.H{"id": id, "name": name, "email": email, "phone": phone, "company": company, "message": message, "read": read, "created_at": createdAt})
	}
	c.JSON(http.StatusOK, items)
}

func (h *Handler) DeleteMessage(c *gin.Context) {
	id := c.Param("id")
	h.db.Exec("DELETE FROM messages WHERE id=$1", id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
