package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/krnveersharma/Statuses/realtime"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now; restrict in production
	},
}

func WebSocketHandler(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	realtime.Register(conn)
	defer realtime.Unregister(conn)

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}
		realtime.Broadcast(message)
	}
}
