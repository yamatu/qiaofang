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
		api.GET("/content-sections", h.GetContentSections)
		api.GET("/site-data", h.GetSiteData)
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
			admin.GET("/content-sections", h.GetAdminContentSections)
			admin.POST("/content-sections", h.CreateContentSection)
			admin.PUT("/content-sections/:id", h.UpdateContentSection)
			admin.DELETE("/content-sections/:id", h.DeleteContentSection)
			admin.GET("/content-sync/export", h.ExportContentSections)
			admin.POST("/content-sync/import", h.ImportContentSections)
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
	CREATE TABLE IF NOT EXISTS content_sections (
		id SERIAL PRIMARY KEY,
		page_key VARCHAR(100) NOT NULL,
		section_key VARCHAR(100) NOT NULL,
		title VARCHAR(255) NOT NULL DEFAULT '',
		subtitle VARCHAR(255) NOT NULL DEFAULT '',
		body TEXT NOT NULL DEFAULT '',
		items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
		sort_order INT DEFAULT 0,
		active BOOLEAN DEFAULT true,
		updated_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(page_key, section_key)
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
	seedContentSections(db)
	log.Println("Database schema initialized")
}

func seedContentSections(db *sql.DB) {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM content_sections").Scan(&count); err != nil || count > 0 {
		return
	}

	sections := []struct {
		pageKey    string
		sectionKey string
		title      string
		subtitle   string
		body       string
		itemsJSON  string
		sortOrder  int
	}{
		{
			pageKey:    "about",
			sectionKey: "company_profile",
			title:      "企业简介",
			subtitle:   "专业研发生产线束和天线产品的高新技术企业",
			body:       "昆山乔方电子科技有限公司专业研发生产消费电子、汽车、服务器、工业设备、储能等领域的各类线束和天线产品。公司经过15年以上发展，拥有多名10年以上行业经验的技术型和管理型人员，遵循诚信为本、质量第一、客户至上、永续经营的管理理念。",
			itemsJSON:  `["2008年成立，持续深耕线束与天线产品研发制造","2024年10月搬入4万平方米自建厂房","团队总人数约602人，工程、品质、生产和管理体系完整","通过ISO9001、ISO14001、IATF16949、QC080000、UL认证，并获得国家级高新技术企业证书"]`,
			sortOrder:  10,
		},
		{
			pageKey:    "about",
			sectionKey: "core_competitiveness",
			title:      "核心竞争力",
			subtitle:   "定制、响应、品质、服务和成本的综合能力",
			body:       "乔方电子围绕不同行业和客户需求提供精准化定制服务，以先进生产工艺和质量管理流程确保品质一致性，并通过专业服务团队提供售前、售中及售后支持。",
			itemsJSON:  `["针对不同行业及客户需求进行精准定制","全天候响应客户需求，支持就近服务","先进生产工艺和质量流程确保品质一致性","专业服务团队覆盖售前、售中和售后","与客户及伙伴深度合作，实现资源共享和优势互补","产品性能稳定，兼顾高性价比"]`,
			sortOrder:  20,
		},
		{
			pageKey:    "about",
			sectionKey: "manufacturing_capacity",
			title:      "制造与测试能力",
			subtitle:   "覆盖线束组装、焊接、压接、注塑和信号完整性测试",
			body:       "公司具备线束结构设计、模流分析、电气分析、可靠性测试、信号完整性测试和自动化组装能力，可支撑高速线、车载线束、储能高压线束、天线线束和声学连接组件等产品制造。",
			itemsJSON:  `["半自动化组装兼顾大批量效率和定制灵活性","精密焊接、热压焊、激光焊、软光束焊接等制程能力","剥线、压接、穿壳、热熔、注塑、超声波焊接和光纤组装能力","VNA、TDR等高速线信号完整性测试能力","盐雾、高低温循环、EDX能谱、压力传感和影像检测设备"]`,
			sortOrder:  30,
		},
		{
			pageKey:    "products",
			sectionKey: "application_fields",
			title:      "应用领域",
			subtitle:   "覆盖消费电子、汽车、储能、工业设备和服务器",
			body:       "乔方电子产品应用于手机、智能家电、VR、滑板车、平板、耳机、游戏机、路由器、笔记本、音响、储能、电梯、汽车、服务器和触控笔等场景。",
			itemsJSON:  `["手机","智能家电","VR","滑板车","平板","耳机","游戏机","路由器","笔记本","音响","储能","电梯","汽车","服务器","触控笔"]`,
			sortOrder:  10,
		},
		{
			pageKey:    "products",
			sectionKey: "product_series",
			title:      "产品系列",
			subtitle:   "线束、天线、高速连接和储能高压线束",
			body:       "公司产品覆盖天线线束、声学线束、车载线束、储能线束、工业线束、DAC高速线、外部高速线和内部高速线，可根据客户项目需求进行规格、结构和制程定制。",
			itemsJSON:  `["天线线束","声学线束","车载线束","储能线束","工业线束","DAC高速线","外部高速线","内部高速线"]`,
			sortOrder:  20,
		},
		{
			pageKey:    "products",
			sectionKey: "server_high_speed",
			title:      "服务器高速线能力",
			subtitle:   "面向数据中心、HPC、存储和网络设备",
			body:       "乔方电子正在布局服务器高速线研发能力，覆盖外部DAC/AOC和内部MCIO、SlimSAS、HD MiniSAS等高速互连产品，支持PCIe Gen4/Gen5、SAS 4.0等应用需求。",
			itemsJSON:  `["800G QSFP-DD / OSFP DAC","1.6T OSFP DAC、ACC、AEC","QSFP112 DAC、SFP112 DAC","MCIO、SlimSAS、HD MiniSAS内部线缆","PCIe Gen4/Gen5信号完整性测试","85 Ohm和100 Ohm阻抗应用"]`,
			sortOrder:  30,
		},
		{
			pageKey:    "quality",
			sectionKey: "quality_assurance",
			title:      "品质保证",
			subtitle:   "质量持续改善、准时交付、绿色环保生产",
			body:       "公司坚持质量持续改善和技术精益求精，重视准时交付、绿色环保生产、法规遵循和客户满意。2025年客户投诉目标为0起，长期目标为客户满意度100%。",
			itemsJSON:  `["ISO9001:2015质量管理体系认证","ISO14001:2015环境管理体系认证","IATF 16949:2016汽车工业体系认证","QC080000有害物质过程管理体系认证","UL安规认证","国家级高新技术企业证书"]`,
			sortOrder:  10,
		},
	}

	for _, section := range sections {
		if _, err := db.Exec(
			`INSERT INTO content_sections (page_key, section_key, title, subtitle, body, items_json, sort_order, active)
			 VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,true)
			 ON CONFLICT (page_key, section_key) DO NOTHING`,
			section.pageKey, section.sectionKey, section.title, section.subtitle, section.body, section.itemsJSON, section.sortOrder,
		); err != nil {
			log.Printf("Failed to seed content section %s/%s: %v", section.pageKey, section.sectionKey, err)
		}
	}
}
