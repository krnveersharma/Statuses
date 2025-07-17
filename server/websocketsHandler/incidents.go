package websocketsHandler

import (
	"encoding/json"

	"github.com/krnveersharma/Statuses/realtime"
	Schemas "github.com/krnveersharma/Statuses/schemas"
)

func UpdateIncident(incidentId, orgId string, incident Schemas.EditInstance) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    orgId + "_incident_updated_" + incidentId,
		"service": incident,
	})
	realtime.Broadcast(msg)
	CreateIncident(orgId, incident)
}

func CreateIncident(orgId string, newIncident Schemas.EditInstance) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":     orgId + "_incident_created",
		"incident": newIncident,
	})
	realtime.Broadcast(msg)
}
