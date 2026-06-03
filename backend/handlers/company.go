package handlers

import (
	"archive/tar"
	"compress/gzip"
	"database/sql"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"os/exec"
	pathpkg "path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetCompanyInfo(c *gin.Context) {
	var about, phone, email, address, wechatQR, logoURL, logoSmallURL, aboutImage, heroImage string
	var aboutBanner, productsBanner, certificatesBanner, newsBanner, contactBanner string
	var logoWidth, logoHeight int
	err := h.db.QueryRow("SELECT COALESCE(about_text,''), COALESCE(phone,''), COALESCE(email,''), COALESCE(address,''), COALESCE(wechat_qr,''), COALESCE(logo_url,''), COALESCE(logo_small_url,''), COALESCE(about_image,''), COALESCE(hero_image,''), COALESCE(logo_width,0), COALESCE(logo_height,0), COALESCE(about_banner,''), COALESCE(products_banner,''), COALESCE(certificates_banner,''), COALESCE(news_banner,''), COALESCE(contact_banner,'') FROM company_info LIMIT 1").
		Scan(&about, &phone, &email, &address, &wechatQR, &logoURL, &logoSmallURL, &aboutImage, &heroImage, &logoWidth, &logoHeight, &aboutBanner, &productsBanner, &certificatesBanner, &newsBanner, &contactBanner)
	if err != nil {
		if err != sql.ErrNoRows {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"about_text": about, "phone": phone, "email": email,
		"address": address, "wechat_qr": wechatQR,
		"logo_url": logoURL, "logo_small_url": logoSmallURL,
		"about_image": aboutImage, "hero_image": heroImage,
		"logo_width": logoWidth, "logo_height": logoHeight,
		"about_banner": aboutBanner, "products_banner": productsBanner,
		"certificates_banner": certificatesBanner, "news_banner": newsBanner,
		"contact_banner": contactBanner,
	})
}

func (h *Handler) GetFavicon(c *gin.Context) {
	var logoSmallURL, logoURL string
	err := h.db.QueryRow("SELECT COALESCE(logo_small_url,''), COALESCE(logo_url,'') FROM company_info LIMIT 1").Scan(&logoSmallURL, &logoURL)
	if err != nil && err != sql.ErrNoRows {
		c.Status(http.StatusInternalServerError)
		return
	}

	iconURL := logoSmallURL
	if iconURL == "" {
		iconURL = logoURL
	}

	c.Header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
	c.Header("CDN-Cache-Control", "no-store")
	c.Header("Cloudflare-CDN-Cache-Control", "no-store")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	if strings.HasPrefix(iconURL, "http://") || strings.HasPrefix(iconURL, "https://") {
		c.Redirect(http.StatusTemporaryRedirect, iconURL)
		return
	}

	if strings.HasPrefix(iconURL, "/uploads/") {
		filename := filepath.Base(iconURL)
		filePath := filepath.Join("uploads", filename)
		if _, err := os.Stat(filePath); err == nil {
			contentType := mime.TypeByExtension(strings.ToLower(filepath.Ext(filePath)))
			if contentType == "" {
				contentType = "image/png"
			}
			c.Header("Content-Type", contentType)
			c.File(filePath)
			return
		}
	}

	c.Data(http.StatusOK, "image/svg+xml", []byte(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2563eb"/><text x="32" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#fff">Q</text></svg>`))
}

func (h *Handler) UpdateCompanyInfo(c *gin.Context) {
	var req struct {
		AboutText          string `json:"about_text"`
		Phone              string `json:"phone"`
		Email              string `json:"email"`
		Address            string `json:"address"`
		WechatQR           string `json:"wechat_qr"`
		LogoURL            string `json:"logo_url"`
		LogoSmallURL       string `json:"logo_small_url"`
		AboutImage         string `json:"about_image"`
		HeroImage          string `json:"hero_image"`
		LogoWidth          int    `json:"logo_width"`
		LogoHeight         int    `json:"logo_height"`
		AboutBanner        string `json:"about_banner"`
		ProductsBanner     string `json:"products_banner"`
		CertificatesBanner string `json:"certificates_banner"`
		NewsBanner         string `json:"news_banner"`
		ContactBanner      string `json:"contact_banner"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.LogoWidth < 0 {
		req.LogoWidth = 0
	}
	if req.LogoHeight < 0 {
		req.LogoHeight = 0
	}

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM company_info"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if _, err := tx.Exec(
		"INSERT INTO company_info (about_text, phone, email, address, wechat_qr, logo_url, logo_small_url, about_image, hero_image, logo_width, logo_height, about_banner, products_banner, certificates_banner, news_banner, contact_banner) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
		req.AboutText, req.Phone, req.Email, req.Address, req.WechatQR, req.LogoURL, req.LogoSmallURL, req.AboutImage, req.HeroImage, req.LogoWidth, req.LogoHeight, req.AboutBanner, req.ProductsBanner, req.CertificatesBanner, req.NewsBanner, req.ContactBanner,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) BackupDatabase(c *gin.Context) {
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "qiaofang"
	}
	backupDir := "backups"
	os.MkdirAll(backupDir, 0755)

	timestamp := time.Now().Format("20060102_150405")
	sqlFile := filepath.Join(backupDir, fmt.Sprintf("dump_%s.sql", timestamp))
	archiveFile := fmt.Sprintf("backup_%s.tar.gz", timestamp)
	archivePath := filepath.Join(backupDir, archiveFile)

	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}

	cmd := exec.Command("pg_dump",
		"-h", dbHost, "-p", dbPort, "-U", dbUser, "-d", dbName, "--clean", "--if-exists", "-f", sqlFile)
	cmd.Env = append(os.Environ(), "PGPASSWORD="+os.Getenv("DB_PASSWORD"))
	if output, err := cmd.CombinedOutput(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "pg_dump failed: " + string(output)})
		return
	}

	if err := createTarGz(archivePath, sqlFile, "uploads"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "archive failed: " + err.Error()})
		return
	}
	os.Remove(sqlFile)
	c.JSON(http.StatusOK, gin.H{"message": "backup created", "filename": archiveFile})
}

func createTarGz(outPath, sqlFile, uploadsDir string) error {
	f, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer f.Close()
	gw := gzip.NewWriter(f)
	defer gw.Close()
	tw := tar.NewWriter(gw)
	defer tw.Close()

	if err := addFileToTar(tw, sqlFile, "dump.sql"); err != nil {
		return err
	}
	manifest := fmt.Sprintf("{\"created_at\":\"%s\",\"contents\":[\"database\",\"uploads\"]}\n", time.Now().Format(time.RFC3339))
	if err := addTextToTar(tw, "manifest.json", manifest); err != nil {
		return err
	}
	if _, err := os.Stat(uploadsDir); err == nil {
		filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return nil
			}
			return addFileToTar(tw, path, filepath.ToSlash(path))
		})
	}
	return nil
}

func addTextToTar(tw *tar.Writer, name, content string) error {
	header := &tar.Header{Name: name, Size: int64(len(content)), Mode: 0644, ModTime: time.Now()}
	if err := tw.WriteHeader(header); err != nil {
		return err
	}
	_, err := tw.Write([]byte(content))
	return err
}

func addFileToTar(tw *tar.Writer, filePath, name string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()
	info, _ := file.Stat()
	header := &tar.Header{Name: name, Size: info.Size(), Mode: 0644, ModTime: info.ModTime()}
	tw.WriteHeader(header)
	io.Copy(tw, file)
	return nil
}

func (h *Handler) ListBackups(c *gin.Context) {
	entries, err := os.ReadDir("backups")
	if err != nil {
		c.JSON(http.StatusOK, []gin.H{})
		return
	}
	var backups []gin.H
	for _, e := range entries {
		if !strings.HasSuffix(e.Name(), ".tar.gz") && !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}
		info, _ := e.Info()
		if info != nil {
			backups = append(backups, gin.H{
				"filename": e.Name(),
				"size":     strconv.FormatInt(info.Size(), 10),
				"date":     info.ModTime().Format("2006-01-02 15:04:05"),
			})
		}
	}
	c.JSON(http.StatusOK, backups)
}

func (h *Handler) RestoreDatabase(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "filename required"})
		return
	}
	backupPath := filepath.Join("backups", filename)
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "backup not found"})
		return
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "qiaofang"
	}
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}
	pgPass := os.Getenv("DB_PASSWORD")

	if strings.HasSuffix(filename, ".tar.gz") {
		sqlFile, uploadsDir, err := extractTarGz(backupPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "extract failed: " + err.Error()})
			return
		}
		defer os.Remove(sqlFile)
		defer os.RemoveAll(uploadsDir)
		if err := restoreSQL(sqlFile, dbHost, dbPort, dbUser, dbName, pgPass); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := replaceUploads(uploadsDir, "uploads"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "uploads restore failed: " + err.Error()})
			return
		}
	} else {
		if err := restoreSQL(backupPath, dbHost, dbPort, dbUser, dbName, pgPass); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "restore completed"})
}

func extractTarGz(archivePath string) (string, string, error) {
	f, err := os.Open(archivePath)
	if err != nil {
		return "", "", err
	}
	defer f.Close()
	gr, err := gzip.NewReader(f)
	if err != nil {
		return "", "", err
	}
	defer gr.Close()
	tr := tar.NewReader(gr)

	var sqlFile string
	uploadsDir, err := os.MkdirTemp("", "qiaofang_uploads_restore_*")
	if err != nil {
		return "", "", err
	}
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			os.RemoveAll(uploadsDir)
			return "", "", err
		}
		target := pathpkg.Clean(strings.ReplaceAll(header.Name, "\\", "/"))
		if target == "." || strings.HasPrefix(target, "../") || strings.HasPrefix(target, "/") {
			continue
		}
		if strings.HasPrefix(target, "uploads/") {
			relativeUpload := strings.TrimPrefix(target, "uploads/")
			if relativeUpload == "" || strings.HasPrefix(relativeUpload, "../") {
				continue
			}
			outPath := filepath.Join(uploadsDir, filepath.FromSlash(relativeUpload))
			if header.FileInfo().IsDir() {
				os.MkdirAll(outPath, 0755)
				continue
			}
			os.MkdirAll(filepath.Dir(outPath), 0755)
			out, err := os.Create(outPath)
			if err != nil {
				continue
			}
			io.Copy(out, tr)
			out.Close()
		} else if strings.HasSuffix(target, ".sql") {
			tmp, _ := os.CreateTemp("", "restore_*.sql")
			io.Copy(tmp, tr)
			sqlFile = tmp.Name()
			tmp.Close()
		}
	}
	if sqlFile == "" {
		os.RemoveAll(uploadsDir)
		return "", "", fmt.Errorf("dump.sql not found in backup")
	}
	return sqlFile, uploadsDir, nil
}

func replaceUploads(sourceDir, targetDir string) error {
	if sourceDir == "" {
		return nil
	}
	if err := os.RemoveAll(targetDir); err != nil {
		return err
	}
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}
	return filepath.WalkDir(sourceDir, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		relative, err := filepath.Rel(sourceDir, path)
		if err != nil || relative == "." {
			return err
		}
		targetPath := filepath.Join(targetDir, relative)
		if entry.IsDir() {
			return os.MkdirAll(targetPath, 0755)
		}
		return copyFile(path, targetPath)
	})
}

func copyFile(sourcePath, targetPath string) error {
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return err
	}
	source, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer source.Close()

	target, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer target.Close()

	_, err = io.Copy(target, source)
	return err
}

func restoreSQL(sqlFile, host, port, user, dbName, password string) error {
	resetCmd := exec.Command("psql", "-h", host, "-p", port, "-U", user, "-d", dbName, "-c", "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;")
	resetCmd.Env = append(os.Environ(), "PGPASSWORD="+password)
	if output, err := resetCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("database reset failed: %s", string(output))
	}

	cmd := exec.Command("psql", "-h", host, "-p", port, "-U", user, "-d", dbName, "-f", sqlFile)
	cmd.Env = append(os.Environ(), "PGPASSWORD="+password)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("restore failed: %s", string(output))
	}
	return nil
}
