package handlers

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html"
	"log"
	"mime"
	"net"
	"net/http"
	"net/smtp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type smtpConfig struct {
	Server       string
	Port         int
	Account      string
	Nickname     string
	AuthCode     string
	AdminEmail   string
	TestEmail    string
	UsingEnvCode bool
}

type mailConfigRequest struct {
	SMTPServer    string `json:"smtp_server"`
	SMTPPort      int    `json:"smtp_port"`
	EmailAccount  string `json:"email_account"`
	EmailNickname string `json:"email_nickname"`
	EmailAuthCode string `json:"email_auth_code"`
	ClearAuthCode bool   `json:"clear_auth_code"`
	AdminEmail    string `json:"admin_email"`
	TestEmail     string `json:"test_email"`
}

func (h *Handler) GetMailConfig(c *gin.Context) {
	cfg := h.smtpConfig()
	c.JSON(http.StatusOK, gin.H{
		"smtp_server":                cfg.Server,
		"smtp_port":                  cfg.Port,
		"email_account":              cfg.Account,
		"email_nickname":             cfg.Nickname,
		"email_auth_code_configured": cfg.AuthCode != "",
		"email_auth_code_mask":       maskSecret(cfg.AuthCode),
		"using_env_auth_code":        cfg.UsingEnvCode,
		"admin_email":                cfg.AdminEmail,
		"test_email":                 cfg.TestEmail,
	})
}

func (h *Handler) SaveMailConfig(c *gin.Context) {
	var req mailConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.SMTPPort <= 0 {
		req.SMTPPort = 465
	}

	settings := map[string]string{
		"smtp_server":    strings.TrimSpace(req.SMTPServer),
		"smtp_port":      strconv.Itoa(req.SMTPPort),
		"email_account":  strings.TrimSpace(req.EmailAccount),
		"email_nickname": strings.TrimSpace(req.EmailNickname),
		"admin_email":    strings.TrimSpace(req.AdminEmail),
		"test_email":     strings.TrimSpace(req.TestEmail),
	}
	for key, value := range settings {
		if err := h.setSetting(key, value); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if req.ClearAuthCode {
		if err := h.setSetting("email_auth_code", ""); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else if strings.TrimSpace(req.EmailAuthCode) != "" {
		if err := h.setSetting("email_auth_code", strings.TrimSpace(req.EmailAuthCode)); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "saved"})
}

func (h *Handler) SendTestMail(c *gin.Context) {
	var req struct {
		TestEmail string `json:"test_email"`
	}
	_ = c.ShouldBindJSON(&req)

	cfg := h.smtpConfig()
	target := strings.TrimSpace(req.TestEmail)
	if target == "" {
		target = cfg.TestEmail
	}
	recipients := parseEmailList(target)
	if len(recipients) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "test email is required"})
		return
	}

	htmlBody := emailPage("乔方科技 SMTP 测试邮件", `
		<p>这是一封后台 SMTP 配置测试邮件。</p>
		<table>
			<tr><th>发送时间</th><td>`+html.EscapeString(time.Now().Format("2006-01-02 15:04:05"))+`</td></tr>
			<tr><th>SMTP 服务器</th><td>`+html.EscapeString(cfg.Server)+`</td></tr>
			<tr><th>邮箱账号</th><td>`+html.EscapeString(cfg.Account)+`</td></tr>
		</table>
	`)
	if err := sendSMTPMail(cfg, recipients, "乔方科技 SMTP 测试邮件", htmlBody, ""); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "sent"})
}

func (h *Handler) sendContactMessageEmail(message contactMessageRequest) {
	cfg := h.smtpConfig()
	recipients := parseEmailList(cfg.AdminEmail)
	if len(recipients) == 0 {
		return
	}

	subject := "网站新留言"
	if strings.TrimSpace(message.Name) != "" {
		subject += " - " + headerValue(message.Name)
	}

	htmlBody := emailPage("网站新留言通知", `
		<p>网站联系表单收到一条新的客户留言，请及时处理。</p>
		<table>
			<tr><th>姓名</th><td>`+mailValue(message.Name)+`</td></tr>
			<tr><th>邮箱</th><td>`+mailValue(message.Email)+`</td></tr>
			<tr><th>电话</th><td>`+mailValue(message.Phone)+`</td></tr>
			<tr><th>公司</th><td>`+mailValue(message.Company)+`</td></tr>
			<tr><th>留言内容</th><td>`+mailMultilineValue(message.Message)+`</td></tr>
			<tr><th>提交时间</th><td>`+html.EscapeString(time.Now().Format("2006-01-02 15:04:05"))+`</td></tr>
		</table>
	`)
	if err := sendSMTPMail(cfg, recipients, subject, htmlBody, headerValue(message.Email)); err != nil {
		log.Printf("contact email notification failed: %v", err)
	}
}

func (h *Handler) smtpConfig() smtpConfig {
	port := 465
	portText := firstNonEmpty(h.setting("smtp_port"), firstEnv("SMTP_PORT", "MAIL_PORT"))
	if parsed, err := strconv.Atoi(portText); err == nil && parsed > 0 {
		port = parsed
	}

	authCode := h.setting("email_auth_code")
	envAuthCode := firstEnv("SMTP_AUTH_CODE", "SMTP_PASSWORD", "MAIL_PASSWORD")
	usingEnvCode := false
	if authCode == "" {
		authCode = envAuthCode
		usingEnvCode = envAuthCode != ""
	}

	return smtpConfig{
		Server:       firstNonEmpty(h.setting("smtp_server"), firstEnv("SMTP_SERVER", "SMTP_HOST", "MAIL_HOST")),
		Port:         port,
		Account:      firstNonEmpty(h.setting("email_account"), firstEnv("SMTP_ACCOUNT", "SMTP_USERNAME", "MAIL_USERNAME")),
		Nickname:     firstNonEmpty(h.setting("email_nickname"), firstEnv("SMTP_NICKNAME", "MAIL_NICKNAME"), "乔方科技"),
		AuthCode:     authCode,
		AdminEmail:   firstNonEmpty(h.setting("admin_email"), firstEnv("ADMIN_EMAIL", "MAIL_ADMIN_EMAIL")),
		TestEmail:    firstNonEmpty(h.setting("test_email"), firstEnv("TEST_EMAIL", "MAIL_TEST_EMAIL")),
		UsingEnvCode: usingEnvCode,
	}
}

func sendSMTPMail(cfg smtpConfig, recipients []string, subject, htmlBody, replyTo string) error {
	if strings.TrimSpace(cfg.Server) == "" {
		return fmt.Errorf("SMTP服务器未配置")
	}
	if cfg.Port <= 0 {
		return fmt.Errorf("SMTP端口未配置")
	}
	if strings.TrimSpace(cfg.Account) == "" {
		return fmt.Errorf("邮箱账号未配置")
	}
	if strings.TrimSpace(cfg.AuthCode) == "" {
		return fmt.Errorf("邮箱授权码未配置")
	}
	if len(recipients) == 0 {
		return fmt.Errorf("收件人邮箱未配置")
	}

	addr := net.JoinHostPort(cfg.Server, strconv.Itoa(cfg.Port))
	client, err := smtpClient(addr, cfg.Server, cfg.Port)
	if err != nil {
		return err
	}
	defer client.Close()

	if ok, _ := client.Extension("AUTH"); ok {
		if err := client.Auth(smtp.PlainAuth("", cfg.Account, cfg.AuthCode, cfg.Server)); err != nil {
			return err
		}
	}
	if err := client.Mail(cfg.Account); err != nil {
		return err
	}
	for _, recipient := range recipients {
		if err := client.Rcpt(recipient); err != nil {
			return err
		}
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := writer.Write(buildMailMessage(cfg, recipients, subject, htmlBody, replyTo)); err != nil {
		writer.Close()
		return err
	}
	if err := writer.Close(); err != nil {
		return err
	}
	return client.Quit()
}

func smtpClient(addr, server string, port int) (*smtp.Client, error) {
	if port == 465 {
		conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: server})
		if err != nil {
			return nil, err
		}
		return smtp.NewClient(conn, server)
	}

	client, err := smtp.Dial(addr)
	if err != nil {
		return nil, err
	}
	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{ServerName: server}); err != nil {
			client.Close()
			return nil, err
		}
	}
	return client, nil
}

func buildMailMessage(cfg smtpConfig, recipients []string, subject, htmlBody, replyTo string) []byte {
	fromName := strings.TrimSpace(cfg.Nickname)
	if fromName == "" {
		fromName = cfg.Account
	}

	var buffer bytes.Buffer
	buffer.WriteString("From: " + mime.QEncoding.Encode("UTF-8", headerValue(fromName)) + " <" + headerValue(cfg.Account) + ">\r\n")
	buffer.WriteString("To: " + strings.Join(headerValues(recipients), ", ") + "\r\n")
	if replyTo != "" {
		buffer.WriteString("Reply-To: " + headerValue(replyTo) + "\r\n")
	}
	buffer.WriteString("Subject: " + mime.QEncoding.Encode("UTF-8", headerValue(subject)) + "\r\n")
	buffer.WriteString("Date: " + time.Now().Format(time.RFC1123Z) + "\r\n")
	buffer.WriteString("MIME-Version: 1.0\r\n")
	buffer.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	buffer.WriteString("\r\n")
	buffer.WriteString(htmlBody)
	return buffer.Bytes()
}

func parseEmailList(value string) []string {
	raw := strings.FieldsFunc(value, func(r rune) bool {
		return r == ',' || r == ';' || r == '\n' || r == '\r'
	})
	emails := make([]string, 0, len(raw))
	for _, item := range raw {
		item = strings.TrimSpace(item)
		if item != "" {
			emails = append(emails, item)
		}
	}
	return emails
}

func headerValue(value string) string {
	value = strings.ReplaceAll(value, "\r", " ")
	value = strings.ReplaceAll(value, "\n", " ")
	return strings.TrimSpace(value)
}

func headerValues(values []string) []string {
	out := make([]string, 0, len(values))
	for _, value := range values {
		if cleaned := headerValue(value); cleaned != "" {
			out = append(out, cleaned)
		}
	}
	return out
}

func emailPage(title, body string) string {
	return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body{font-family:Arial,"Microsoft YaHei",sans-serif;color:#111827;background:#f8fafc;padding:24px;}
    .card{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;}
    .head{background:#2563eb;color:#fff;padding:18px 22px;font-size:18px;font-weight:700;}
    .content{padding:22px;font-size:14px;line-height:1.7;}
    table{width:100%;border-collapse:collapse;margin-top:16px;}
    th,td{border-bottom:1px solid #e5e7eb;padding:12px;text-align:left;vertical-align:top;}
    th{width:120px;background:#f9fafb;color:#4b5563;font-weight:600;}
    .foot{padding:14px 22px;color:#9ca3af;font-size:12px;background:#f9fafb;}
  </style>
</head>
<body>
  <div class="card">
    <div class="head">` + html.EscapeString(title) + `</div>
    <div class="content">` + body + `</div>
    <div class="foot">此邮件由乔方科技官网自动发送。</div>
  </div>
</body>
</html>`
}

func mailValue(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "未填写"
	}
	return html.EscapeString(value)
}

func mailMultilineValue(value string) string {
	return strings.ReplaceAll(mailValue(value), "\n", "<br>")
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
