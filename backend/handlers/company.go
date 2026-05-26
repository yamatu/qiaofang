package handlers

import (
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetCompanyInfo(c *gin.Context) {
	var about, phone, email, address, wechatQR, logoURL, logoSmallURL, aboutImage, heroImage string
	err := h.db.QueryRow("SELECT COALESCE(about_text,''), COALESCE(phone,''), COALESCE(email,''), COALESCE(address,''), COALESCE(wechat_qr,''), COALESCE(logo_url,''), COALESCE(logo_small_url,''), COALESCE(about_image,''), COALESCE(hero_image,'') FROM company_info LIMIT 1").
		Scan(&about, &phone, &email, &address, &wechatQR, &logoURL, &logoSmallURL, &aboutImage, &heroImage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"about_text": about, "phone": phone, "email": email,
		"address": address, "wechat_qr": wechatQR,
		"logo_url": logoURL, "logo_small_url": logoSmallURL,
		"about_image": aboutImage, "hero_image": heroImage,
	})
}

func (h *Handler) UpdateCompanyInfo(c *gin.Context) {
	var req struct {
		AboutText    string `json:"about_text"`
		Phone        string `json:"phone"`
		Email        string `json:"email"`
		Address      string `json:"address"`
		WechatQR     string `json:"wechat_qr"`
		LogoURL      string `json:"logo_url"`
		LogoSmallURL string `json:"logo_small_url"`
		AboutImage   string `json:"about_image"`
		HeroImage    string `json:"hero_image"`
	}
	c.ShouldBindJSON(&req)
	h.db.Exec("DELETE FROM company_info")
	h.db.Exec(
		"INSERT INTO company_info (about_text, phone, email, address, wechat_qr, logo_url, logo_small_url, about_image, hero_image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
		req.AboutText, req.Phone, req.Email, req.Address, req.WechatQR, req.LogoURL, req.LogoSmallURL, req.AboutImage, req.HeroImage,
	)
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
		"-h", dbHost, "-p", dbPort, "-U", dbUser, "-d", dbName, "-f", sqlFile)
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
	if _, err := os.Stat(uploadsDir); err == nil {
		filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return nil
			}
			return addFileToTar(tw, path, path)
		})
	}
	return nil
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
		sqlFile, err := extractTarGz(backupPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "extract failed: " + err.Error()})
			return
		}
		defer os.Remove(sqlFile)
		if err := restoreSQL(sqlFile, dbHost, dbPort, dbUser, dbName, pgPass); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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

func extractTarGz(archivePath string) (string, error) {
	f, err := os.Open(archivePath)
	if err != nil {
		return "", err
	}
	defer f.Close()
	gr, err := gzip.NewReader(f)
	if err != nil {
		return "", err
	}
	defer gr.Close()
	tr := tar.NewReader(gr)

	var sqlFile string
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", err
		}
		target := header.Name
		if strings.HasPrefix(target, "uploads/") {
			os.MkdirAll(filepath.Dir(target), 0755)
			out, err := os.Create(target)
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
	return sqlFile, nil
}

func restoreSQL(sqlFile, host, port, user, dbName, password string) error {
	cmd := exec.Command("psql", "-h", host, "-p", port, "-U", user, "-d", dbName, "-f", sqlFile)
	cmd.Env = append(os.Environ(), "PGPASSWORD="+password)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("restore failed: %s", string(output))
	}
	return nil
}
