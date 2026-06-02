package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	var id int
	var hash string
	err := h.db.QueryRow("SELECT id, password_hash FROM admins WHERE username=$1", req.Username).Scan(&id, &hash)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "qiaofang-secret-key-2026"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"admin_id": id,
		"username": req.Username,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenStr, _ := token.SignedString([]byte(secret))
	c.JSON(http.StatusOK, gin.H{"token": tokenStr, "username": req.Username})
}

func (h *Handler) UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext
	savePath := filepath.Join("uploads", filename)

	if err := os.MkdirAll("uploads", 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to prepare upload directory"})
		return
	}

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	url := "/uploads/" + filename
	c.JSON(http.StatusOK, gin.H{"url": url, "filename": filename})
}

func (h *Handler) ChangePassword(c *gin.Context) {
	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
		NewUsername string `json:"new_username"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	username, _ := c.Get("username")
	var id int
	var hash string
	err := h.db.QueryRow("SELECT id, password_hash FROM admins WHERE username=$1", username).Scan(&id, &hash)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "old password incorrect"})
		return
	}

	newHash, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	newName := req.NewUsername
	if newName == "" {
		newName = username.(string)
	}
	h.db.Exec("UPDATE admins SET password_hash=$1, username=$2 WHERE id=$3", string(newHash), newName, id)
	c.JSON(http.StatusOK, gin.H{"message": "updated", "username": newName})
}

// Slides CRUD
func (h *Handler) GetSlides(c *gin.Context) {
	rows, err := h.db.Query("SELECT id, title, subtitle, description, image_url, sort_order, active, created_at FROM slides ORDER BY sort_order")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var slides []gin.H
	for rows.Next() {
		var id, sortOrder int
		var title, subtitle, desc, imageURL string
		var active bool
		var createdAt time.Time
		rows.Scan(&id, &title, &subtitle, &desc, &imageURL, &sortOrder, &active, &createdAt)
		slides = append(slides, gin.H{
			"id": id, "title": title, "subtitle": subtitle, "description": desc,
			"image_url": imageURL, "sort_order": sortOrder, "active": active, "created_at": createdAt,
		})
	}
	c.JSON(http.StatusOK, slides)
}
