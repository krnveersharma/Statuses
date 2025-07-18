package dbrequests

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	Schemas "github.com/krnveersharma/Statuses/schemas"
)

func CreateIncident(
	db *sql.DB,
	incident Schemas.IncidentRequest,
	clerkOrgID, createdBy string,
) (string, error) {

	query := `
		INSERT INTO incidents (title, description, status, started_at, clerk_org_id, created_by_clerk)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
	`

	var id string
	err := db.QueryRow(query,
		incident.Title,
		incident.Description,
		incident.Status,
		incident.StartedAt,
		clerkOrgID,
		createdBy,
	).Scan(&id)

	if err != nil {
		return "", err
	}
	return id, err
}

func GetIncidentsForOrg(db *sql.DB, orgID string) ([]Schemas.IncidentTitles, error) {
	rows, err := db.Query(`
		SELECT id, title, status, created_at 
		FROM incidents 
		WHERE clerk_org_id = $1 AND status != 'resolved'
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var incidents []Schemas.IncidentTitles
	for rows.Next() {
		var i Schemas.IncidentTitles
		if err := rows.Scan(&i.ID, &i.Title, &i.Status, &i.CreatedAt); err != nil {
			return nil, err
		}
		incidents = append(incidents, i)
	}

	return incidents, nil
}

func GetIncidentByID(db *sql.DB, incidentID string, orgID string) (*Schemas.Incident, error) {
	query := `
		SELECT id, title, description, status, started_at, resolved_at, created_at, updated_at, created_by_clerk
		FROM incidents
		WHERE id = $1 AND clerk_org_id = $2
	`

	row := db.QueryRow(query, incidentID, orgID)

	var i Schemas.Incident
	err := row.Scan(
		&i.ID,
		&i.Title,
		&i.Description,
		&i.Status,
		&i.StartedAt,
		&i.ResolvedAt,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.CreatedByClerk,
	)

	if err != nil {
		return nil, err
	}
	return &i, nil
}

func LinkIncidentServices(db *sql.DB, incidentID string, links []Schemas.LinkedServiceIn) error {
	log.Printf("[LinkIncidentServices] Linking %d services to incident ID: %s", len(links), incidentID)

	query := `INSERT INTO service_incidents (service_id, incident_id) VALUES ($1, $2)`
	for _, link := range links {
		log.Printf("[LinkIncidentServices] Linking service ID: %s", link.ServiceID)

		_, err := db.Exec(query, link.ServiceID, incidentID)
		if err != nil {
			log.Printf("[LinkIncidentServices] ERROR inserting service_id=%s incident_id=%s: %v", link.ServiceID, incidentID, err)
			return fmt.Errorf("inserting service_id=%s: %w", link.ServiceID, err)
		}
	}
	return nil
}

func UpdateIncident(ctx context.Context, db *sql.DB, orgID string, incident Schemas.EditInstance) error {
	// Update incident data
	updateQuery := `
		UPDATE incidents
		SET title = $1,
			description = $2,
			status = $3,
			started_at = $4,
			updated_at = NOW()
		WHERE id = $5 AND clerk_org_id = $6
	`
	_, err := db.ExecContext(ctx, updateQuery,
		incident.Title,
		incident.Description,
		incident.Status,
		incident.StartedAt,
		incident.ID,
		orgID,
	)
	if err != nil {
		return fmt.Errorf("failed to update incident: %w", err)
	}
	log.Printf("[UpdateIncident] Updated incident ID: %s\n", incident.ID)

	// Delete old service links
	deleteQuery := `DELETE FROM service_incidents WHERE incident_id = $1`
	if _, err := db.ExecContext(ctx, deleteQuery, incident.ID); err != nil {
		return fmt.Errorf("failed to delete old service links: %w", err)
	}
	log.Printf("[UpdateIncident] Cleared old service links for incident ID: %s\n", incident.ID)

	// Link new services
	if err := LinkIncidentServices(db, incident.ID, incident.LinkedServices); err != nil {
		return fmt.Errorf("failed to link new services: %w", err)
	}
	log.Printf("[UpdateIncident] Linked new services for incident ID: %s: %v\n", incident.ID, incident.LinkedServices)

	return nil
}

func UpdateIncidentUpdate(db *sql.DB, message, incidentId, status, userId, fullName string) error {
	query := `
		INSERT INTO incident_updates (incident_id, message, status, created_by_clerk, full_name)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := db.Exec(query, incidentId, message, status, userId, fullName)
	if err != nil {
		log.Printf("[UpdateIncident] Failed to insert update: %v\n", err)
		return err
	}

	return nil
}

func GetIncidentUpdates(db *sql.DB, incidentId string) ([]Schemas.IncidentUpdateData, error) {
	var incidentUpdates []Schemas.IncidentUpdateData

	query := `SELECT id, incident_id, message, status, created_at, full_name, created_by_clerk
	          FROM incident_updates WHERE incident_id = $1`

	rows, err := db.Query(query, incidentId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var update Schemas.IncidentUpdateData
		err := rows.Scan(
			&update.ID,
			&update.IncidentId,
			&update.Message,
			&update.Status,
			&update.CreatedAt,
			&update.FullName,
			&update.CreatedByClerk,
		)
		if err != nil {
			return nil, err
		}
		incidentUpdates = append(incidentUpdates, update)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return incidentUpdates, nil
}

func DeleteIncident(db *sql.DB, incidentID string, orgId string) error {
	_, err := db.Exec("DELETE FROM service_incidents WHERE incident_id = $1", incidentID)
	if err != nil {
		return err
	}
	_, err = db.Exec("DELETE FROM incident_updates WHERE incident_id = $1", incidentID)
	if err != nil {
		return err
	}
	_, err = db.Exec("DELETE FROM incidents WHERE id = $1 AND clerk_org_id = $2", incidentID, orgId)
	return err
}
