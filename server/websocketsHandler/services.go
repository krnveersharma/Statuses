package websocketsHandler

import (
	"encoding/json"

	"github.com/krnveersharma/Statuses/realtime"
	Schemas "github.com/krnveersharma/Statuses/schemas"
)

func UpdateService(serviceId, orgId string, service Schemas.Service) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    orgId + "_service_updated_" + serviceId,
		"service": service,
	})
	realtime.Broadcast(msg)
}

func CreateService(orgId string, service Schemas.Service) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    orgId + "_service_created",
		"service": service,
	})
	realtime.Broadcast(msg)
}
