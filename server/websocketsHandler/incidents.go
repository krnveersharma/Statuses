package websocketsHandler

import (
	"encoding/json"

	"github.com/krnveersharma/Statuses/realtime"
	Schemas "github.com/krnveersharma/Statuses/schemas"
)

func UpdateIncident(incidentId string, incident Schemas.EditInstance) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    "service_created",
		"service": incident,
	})
	realtime.Broadcast(msg)
	CreateIncident(incident)
}

func CreateIncident(newIncident Schemas.EditInstance) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":     "incident_created",
		"incident": newIncident,
	})
	realtime.Broadcast(msg)
}
