package websocketsHandler

import (
	"encoding/json"

	"github.com/krnveersharma/Statuses/realtime"
	Schemas "github.com/krnveersharma/Statuses/schemas"
)

func UpdateService(serviceId string, service Schemas.Service) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    "service_updated_" + serviceId,
		"service": service,
	})
	realtime.Broadcast(msg)
	CreateService(Schemas.ServiceRequest{
		Name:   service.Name,
		Status: service.Status,
	})
}

func CreateService(service Schemas.ServiceRequest) {
	msg, _ := json.Marshal(map[string]interface{}{
		"type":    "service_created",
		"service": service,
	})
	realtime.Broadcast(msg)
}
