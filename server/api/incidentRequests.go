package api

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	dbrequests "github.com/krnveersharma/Statuses/dbRequests"
	middlewares "github.com/krnveersharma/Statuses/midlewares"
	"github.com/krnveersharma/Statuses/realtime"
	Schemas "github.com/krnveersharma/Statuses/schemas"
)

func (a *Api) CreateIncident(ctx *gin.Context) {
	var incident Schemas.IncidentRequest

	clerkUserRaw, exists := ctx.Get("user")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	clerkUser := clerkUserRaw.(*middlewares.UserData)

	if clerkUser.Org.Role != "admin" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Only admin can perform this action"})
		return
	}

	if err := ctx.ShouldBindJSON(&incident); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	if incident.Title == "" || incident.Status == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Title and status are required"})
		return
	}

	incidentId, err := dbrequests.CreateIncident(a.DB, incident, clerkUser.Org.ID, clerkUser.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create incident", "details": err.Error()})
		return
	}

	if len(incident.LinkedServices) > 0 {
		err := dbrequests.LinkIncidentServices(a.DB, incidentId, incident.LinkedServices)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create incident", "details": err.Error()})
			return
		}
	}

	newIncident := Schemas.EditInstance{
		ID:             incidentId,
		Title:          incident.Title,
		Description:    incident.Description,
		Status:         incident.Status,
		LinkedServices: incident.LinkedServices,
	}
	a.UpdateIncidentUpdate(&newIncident, *clerkUser)

	// Broadcast to websockets
	msg, _ := json.Marshal(map[string]interface{}{
		"type":     "incident_created",
		"incident": newIncident,
	})
	realtime.Broadcast(msg)

	ctx.JSON(http.StatusCreated, gin.H{"message": "Incident created successfully"})
}

func (a *Api) GetIncidents(ctx *gin.Context) {
	clerkUserRaw, exists := ctx.Get("user")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	clerkUser := clerkUserRaw.(*middlewares.UserData)

	incidents, err := dbrequests.GetIncidentsForOrg(a.DB, clerkUser.Org.ID)
	if err != nil {
		log.Println("Error in fetching incidents:", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch incidents"})
		return
	}

	ctx.JSON(http.StatusOK, incidents)
}

func (a *Api) GetIncidentByID(ctx *gin.Context) {
	clerkUserRaw, exists := ctx.Get("user")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	clerkUser := clerkUserRaw.(*middlewares.UserData)

	incidentID := ctx.Param("id")
	if incidentID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Missing incident ID"})
		return
	}

	incident, err := dbrequests.GetIncidentByID(a.DB, incidentID, clerkUser.Org.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Incident not found"})
		} else {
			log.Println("error in fetching incident:", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch incident"})
		}
		return
	}

	services, err := dbrequests.GetServicesAffected(a.DB, incidentID)
	if err != nil {
		log.Println("error in fetching services for incident:", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch linked services"})
		return
	}

	logs, err := dbrequests.GetIncidentUpdates(a.DB, incidentID)
	if err != nil {
		log.Println("error in fetching logs: ", err.Error())
	}

	response := struct {
		*Schemas.Incident
		LinkedServices []Schemas.Service            `json:"linked_services"`
		Logs           []Schemas.IncidentUpdateData `json:"logs"`
	}{
		Incident:       incident,
		LinkedServices: services,
		Logs:           logs,
	}
	ctx.JSON(http.StatusOK, response)
}

func (a *Api) EditIncident(ctx *gin.Context) {
	var incident Schemas.EditInstance

	clerkUserRaw, exists := ctx.Get("user")
	if !exists {
		log.Println("[EditIncident] User not found in context")
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	clerkUser := clerkUserRaw.(*middlewares.UserData)

	if clerkUser.Org.Role != "admin" {
		log.Printf("[EditIncident] Unauthorized role: %s\n", clerkUser.Org.Role)
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Only admin can perform this action"})
		return
	}

	if err := ctx.ShouldBindJSON(&incident); err != nil {
		log.Printf("[EditIncident] Failed to bind JSON: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	log.Printf("[EditIncident] Editing incident ID: %s with title: %s\n", incident.ID, incident.Title)

	if err := dbrequests.UpdateIncident(ctx, a.DB, clerkUser.Org.ID, incident); err != nil {
		log.Printf("[EditIncident] %v\n", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update incident", "details": err.Error()})
		return
	}

	a.UpdateIncidentUpdate(&incident, *clerkUser)

	// Broadcast to websockets
	msg, _ := json.Marshal(map[string]interface{}{
		"type":     "incident_updated",
		"incident": incident,
	})
	realtime.Broadcast(msg)

	ctx.JSON(http.StatusOK, gin.H{"message": "Incident updated successfully"})
}

func (a *Api) UpdateIncidentUpdate(incident *Schemas.EditInstance, clerkUser middlewares.UserData) {
	var linkedServices []string
	for i := range incident.LinkedServices {
		linkedServices = append(linkedServices, incident.LinkedServices[i].Name)
	}

	jsonBytes, err := json.Marshal(Schemas.IncidentUpdate{
		Title:          incident.Title,
		Description:    incident.Description,
		StartedAt:      incident.StartedAt,
		LinkedServices: linkedServices,
	})
	if err != nil {
		log.Println("Error marshaling JSON:", err)
		return
	}

	msg := string(jsonBytes)

	err = dbrequests.UpdateIncidentUpdate(a.DB, msg, incident.ID, incident.Status, clerkUser.ID, *clerkUser.FirstName+" "+*clerkUser.LastName)
	if err != nil {
		log.Println("Error in updating incident table:", err)
	}
}
