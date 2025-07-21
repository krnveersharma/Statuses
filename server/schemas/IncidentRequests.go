package Schemas

import "time"

type LinkedServiceIn struct {
	ServiceID *int32 `json:"service_id"`
	Name      string `json:"name"`
}

type IncidentRequest struct {
	Title          string            `json:"title"`
	Description    string            `json:"description"`
	Status         string            `json:"status"`
	StartedAt      string            `json:"started_at"`
	LinkedServices []LinkedServiceIn `json:"linked_services"`
}

type Incident struct {
	ID             string     `json:"id"`
	Title          string     `json:"title"`
	Description    string     `json:"description", omitempty`
	Status         string     `json:"status"`
	StartedAt      time.Time  `json:"started_at"`
	ResolvedAt     *time.Time `json:"resolved_at", omitempty`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	CreatedByClerk string     `json:"created_by_clerk"`
}

type EditInstance struct {
	ID             string            `json:"id"`
	Title          string            `json:"title"`
	Description    string            `json:"description", omitempty`
	Status         string            `json:"status"`
	StartedAt      time.Time         `json:"started_at"`
	LinkedServices []LinkedServiceIn `json:"linked_services"`
}

type IncidentTitles struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type IncidentUpdate struct {
	Title          string   `json:"title"`
	Description    string   `json:description""`
	LinkedServices []string `json:"linked_services"`
}

type IncidentUpdateData struct {
	ID             string    `json:"id"`
	IncidentId     string    `json:"incident_id"`
	Message        string    `json:"message"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	FullName       *string   `json:"full_name"`
	CreatedByClerk string    `json:"created_by_clerk"`
}
