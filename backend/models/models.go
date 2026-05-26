package models

import "time"

type Admin struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type Slide struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Subtitle    string    `json:"subtitle"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`
	SortOrder   int       `json:"sort_order"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
}

type Product struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Category    string    `json:"category"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`
	Specs       string    `json:"specs"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
}

type News struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Summary   string    `json:"summary"`
	Content   string    `json:"content"`
	ImageURL  string    `json:"image_url"`
	Published bool      `json:"published"`
	CreatedAt time.Time `json:"created_at"`
}

type Certificate struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`
	CreatedAt   time.Time `json:"created_at"`
}
