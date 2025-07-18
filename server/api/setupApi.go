package api

import (
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/krnveersharma/Statuses/config"
	dbconnection "github.com/krnveersharma/Statuses/dbConnection"
	middlewares "github.com/krnveersharma/Statuses/midlewares"
	"github.com/krnveersharma/Statuses/websocketsHandler"
)

type Api struct {
	Config config.Config
	DB     *sql.DB
}

func SetupApi(config config.Config) error {
	db, err := dbconnection.SetupDbConnection(config)
	if err != nil {
		return errors.New(err.Error())
	}

	if config.Port == "" {
		return errors.New("PORT is not set")
	}

	service, err := middlewares.InitService(config.ClerkSecretKey)
	if err != nil {
		log.Fatalf("Failed to initialize Clerk service: %v", err)
	}

	api := &Api{
		Config: config,
		DB:     db,
	}

	server := gin.Default()

	server.Use(cors.New(cors.Config{
		AllowOrigins:     []string{config.AllowedHost},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	userRoutes := server.Group("/user", middlewares.GetUserInfo(service, "user"))

	userRoutes.GET("/", api.getUser)
	userRoutes.GET("/get-services", api.GetServices)
	userRoutes.GET("/get-service/:id", api.GetServiceByID)
	userRoutes.GET("/get-incidents", api.GetIncidents)
	userRoutes.GET("/get-incident/:id", api.GetIncidentByID)

	privateRoute := server.Group("/admin", middlewares.GetUserInfo(service, "admin"))

	privateRoute.POST("/create-service", api.CreateService)
	privateRoute.POST("/create-incident", api.CreateIncident)
	privateRoute.PUT("/edit-incident", api.EditIncident)
	privateRoute.PUT("/edit-service", api.EditService)
	privateRoute.DELETE("/delete-service/:id", api.DeleteService)
	privateRoute.DELETE("/delete-incident/:id", api.DeleteIncident)

	// Add WebSocket endpoint
	server.GET("/ws", websocketsHandler.WebSocketHandler)

	server.Run("0.0.0.0:" + config.Port)
	return nil
}
