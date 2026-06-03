package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"qiaofang-backend/handlers"
	"qiaofang-backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPass := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "qiaofang")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable client_encoding=UTF8",
		dbHost, dbPort, dbUser, dbPass, dbName)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Database ping failed:", err)
	}

	initDB(db)

	h := handlers.NewHandler(db)

	r := gin.Default()
	r.Use(func(c *gin.Context) {
		if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
			c.Header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		}
		c.Next()
	})
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Static("/uploads", "./uploads")
	r.Static("/backups", "./backups")
	r.GET("/favicon.ico", h.GetFavicon)

	api := r.Group("/api")
	{
		api.POST("/auth/login", h.Login)

		// Public routes
		api.GET("/slides", h.GetSlides)
		api.GET("/products", h.GetProducts)
		api.GET("/products/:id", h.GetProduct)
		api.GET("/news", h.GetNews)
		api.GET("/news/:id", h.GetNewsItem)
		api.GET("/certificates", h.GetCertificates)
		api.GET("/company", h.GetCompanyInfo)
		api.GET("/favicon", h.GetFavicon)
		api.GET("/categories", h.GetCategories)
		api.GET("/partners", h.GetPartners)
		api.GET("/applications", h.GetApplications)
		api.POST("/contact", h.CreateMessage)

		// Protected admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware())
		{
			admin.POST("/upload", h.UploadImage)
			admin.PUT("/change-password", h.ChangePassword)
			admin.POST("/slides", h.CreateSlide)
			admin.PUT("/slides/:id", h.UpdateSlide)
			admin.DELETE("/slides/:id", h.DeleteSlide)
			admin.GET("/products", h.GetAdminProducts)
			admin.POST("/products", h.CreateProduct)
			admin.PUT("/products/:id", h.UpdateProduct)
			admin.DELETE("/products/:id", h.DeleteProduct)
			admin.POST("/news", h.CreateNews)
			admin.PUT("/news/:id", h.UpdateNews)
			admin.DELETE("/news/:id", h.DeleteNews)
			admin.POST("/certificates", h.CreateCertificate)
			admin.PUT("/certificates/:id", h.UpdateCertificate)
			admin.DELETE("/certificates/:id", h.DeleteCertificate)
			admin.PUT("/company", h.UpdateCompanyInfo)
			admin.POST("/backup", h.BackupDatabase)
			admin.GET("/backups", h.ListBackups)
			admin.POST("/restore/:filename", h.RestoreDatabase)
			admin.GET("/messages", h.GetMessages)
			admin.DELETE("/messages/:id", h.DeleteMessage)
			admin.POST("/categories", h.CreateCategory)
			admin.PUT("/categories/:id", h.UpdateCategory)
			admin.DELETE("/categories/:id", h.DeleteCategory)
			admin.POST("/partners", h.CreatePartner)
			admin.PUT("/partners/:id", h.UpdatePartner)
			admin.DELETE("/partners/:id", h.DeletePartner)
			admin.POST("/applications", h.CreateApplication)
			admin.PUT("/applications/:id", h.UpdateApplication)
			admin.DELETE("/applications/:id", h.DeleteApplication)
			admin.GET("/cache/config", h.GetCacheConfig)
			admin.PUT("/cache/config", h.SaveCacheConfig)
			admin.POST("/cache/purge", h.PurgeCache)
			admin.GET("/mail/config", h.GetMailConfig)
			admin.PUT("/mail/config", h.SaveMailConfig)
			admin.POST("/mail/test", h.SendTestMail)
		}
	}

	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func initDB(db *sql.DB) {
	schema := `
	CREATE TABLE IF NOT EXISTS admins (
		id SERIAL PRIMARY KEY,
		username VARCHAR(100) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT NOW()
	);
	CREATE TABLE IF NOT EXISTS slides (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		subtitle VARCHAR(255),
		description TEXT,
		image_url VARCHAR(500),
		sort_order INT DEFAULT 0,
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT NOW()
	);
	CREATE TABLE IF NOT EXISTS products (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		category VARCHAR(100),
		description TEXT,
		image_url VARCHAR(500),
		specs TEXT,
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT NOW()
	);
	CREATE TABLE IF NOT EXISTS news (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		summary TEXT,
		content TEXT,
		image_url VARCHAR(500),
		published BOOLEAN DEFAULT false,
		created_at TIMESTAMP DEFAULT NOW()
	);
	CREATE TABLE IF NOT EXISTS certificates (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		description TEXT,
		image_url VARCHAR(500),
		created_at TIMESTAMP DEFAULT NOW()
	);
	CREATE TABLE IF NOT EXISTS company_info (
		id SERIAL PRIMARY KEY,
		about_text TEXT,
		phone VARCHAR(50),
		email VARCHAR(100),
		address TEXT,
		wechat_qr VARCHAR(500),
		logo_url VARCHAR(500) DEFAULT '',
		logo_small_url VARCHAR(500) DEFAULT '',
		updated_at TIMESTAMP DEFAULT NOW()
	);
	CREATE TABLE IF NOT EXISTS messages (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100),
		email VARCHAR(100),
		phone VARCHAR(50),
		company VARCHAR(200),
		message TEXT,
		read BOOLEAN DEFAULT false,
		created_at TIMESTAMP DEFAULT NOW()
	);
	CREATE TABLE IF NOT EXISTS categories (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		sort_order INT DEFAULT 0,
		created_at TIMESTAMP DEFAULT NOW()
	);
	CREATE TABLE IF NOT EXISTS partners (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		logo_url VARCHAR(500),
		website VARCHAR(500),
		sort_order INT DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS applications (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		description TEXT,
		image_url VARCHAR(500),
		sort_order INT DEFAULT 0
	);
	CREATE TABLE IF NOT EXISTS site_settings (
		key VARCHAR(100) PRIMARY KEY,
		value TEXT NOT NULL DEFAULT '',
		updated_at TIMESTAMP DEFAULT NOW()
	);
	`
	if _, err := db.Exec(schema); err != nil {
		log.Fatal("Failed to init database schema:", err)
	}
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) DEFAULT ''")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS logo_small_url VARCHAR(500) DEFAULT ''")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS about_image VARCHAR(500) DEFAULT ''")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS hero_image VARCHAR(500) DEFAULT ''")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS logo_width INT DEFAULT 0")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS logo_height INT DEFAULT 0")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS about_banner VARCHAR(500) DEFAULT ''")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS products_banner VARCHAR(500) DEFAULT ''")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS certificates_banner VARCHAR(500) DEFAULT ''")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS news_banner VARCHAR(500) DEFAULT ''")
	db.Exec("ALTER TABLE company_info ADD COLUMN IF NOT EXISTS contact_banner VARCHAR(500) DEFAULT ''")
	log.Println("Database schema initialized")
}
