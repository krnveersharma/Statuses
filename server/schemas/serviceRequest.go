package Schemas

import "time"

type ServiceRequest struct {
	Name   string `json:"name"`
	Status string `json:"status"`
}

type Service struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

type ServiceResponse struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}
