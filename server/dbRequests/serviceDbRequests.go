package dbrequests

import (
	"database/sql"

	Schemas "github.com/krnveersharma/Statuses/schemas"
	"github.com/lib/pq"
)

func AddService(db *sql.DB, serviceData Schemas.ServiceRequest, orgId, clerkId string) (Schemas.Service, error) {
	var service Schemas.Service

	query := `
		INSERT INTO services (name, status, clerk_org_id, created_by_clerk)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, status
	`

	err := db.QueryRow(query, serviceData.Name, serviceData.Status, orgId, clerkId).
		Scan(&service.ID, &service.Name, &service.Status)

	if err != nil {
		return Schemas.Service{}, err
	}

	return service, nil
}

func GetServicesAffected(db *sql.DB, incidentId string) ([]Schemas.Service, error) {
	var services []Schemas.Service

	// First, get all service_ids from service_incidents table
	rows, err := db.Query("SELECT service_id FROM service_incidents WHERE incident_id = $1", incidentId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var serviceIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		serviceIDs = append(serviceIDs, id)
	}

	if len(serviceIDs) == 0 {
		return services, nil // No linked services
	}

	// Now fetch full service details
	query := `
		SELECT id, name, status
		FROM services
		WHERE id = ANY($1)
	`
	rows2, err := db.Query(query, pq.Array(serviceIDs))
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	for rows2.Next() {
		var s Schemas.Service
		if err := rows2.Scan(&s.ID, &s.Name, &s.Status); err != nil {
			return nil, err
		}
		services = append(services, s)
	}

	return services, nil
}

func GetServiceByID(db *sql.DB, serviceID, orgId string) (Schemas.ServiceResponse, error) {
	var service Schemas.ServiceResponse

	query := `SELECT id, name, status, created_at FROM services WHERE id = $1 AND clerk_org_id = $2 LIMIT 1`

	err := db.QueryRow(query, serviceID, orgId).Scan(&service.ID, &service.Name, &service.Status, &service.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return service, nil
		}
		return service, err
	}

	return service, nil
}

func EditService(db *sql.DB, service Schemas.Service, orgId string) error {
	query := `
		UPDATE services
		SET name = $1, status = $2
		WHERE id = $3 AND clerk_org_id = $4
	`

	_, err := db.Exec(query, service.Name, service.Status, service.ID, orgId)
	if err != nil {
		return err
	}

	return nil
}

func DeleteService(db *sql.DB, serviceID int, orgId string) error {
	_, err := db.Exec("DELETE FROM service_incidents WHERE service_id = $1", serviceID)
	if err != nil {
		return err
	}
	_, err = db.Exec("DELETE FROM services WHERE id = $1 AND clerk_org_id = $2", serviceID, orgId)
	return err
}
