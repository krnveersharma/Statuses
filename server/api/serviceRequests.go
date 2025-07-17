package api

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	dbrequests "github.com/krnveersharma/Statuses/dbRequests"
	middlewares "github.com/krnveersharma/Statuses/midlewares"
	Schemas "github.com/krnveersharma/Statuses/schemas"
	"github.com/krnveersharma/Statuses/websocketsHandler"
)

func (a *Api) CreateService(ctx *gin.Context) {
	clerkUserRaw, exists := ctx.Get("user")
	var ServiceRequest Schemas.ServiceRequest

	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	clerkUser := clerkUserRaw.(*middlewares.UserData)

	if clerkUser.Org.Role != "admin" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Only admin can perform this action"})
		return
	}

	if err := ctx.ShouldBindBodyWithJSON(&ServiceRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Request"})
		return
	}

	service, err := dbrequests.AddService(a.DB, ServiceRequest, clerkUser.Org.ID, clerkUser.ID)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"error": "New Service added"})

	// Broadcast to websockets
	websocketsHandler.CreateService(clerkUser.Org.ID, service)
}

func (a *Api) GetServices(ctx *gin.Context) {
	clerkUserRaw, exists := ctx.Get("user")

	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	clerkUser := clerkUserRaw.(*middlewares.UserData)

	fmt.Printf("user is: %+v", clerkUser)
	rows, err := a.DB.Query("SELECT id, name, status FROM services where clerk_org_id = $1", clerkUser.Org.ID)

	if err != nil {
		log.Println("Error in fetching services:", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
		return
	}
	defer rows.Close()

	var services []Schemas.Service
	for rows.Next() {
		var s Schemas.Service
		if err := rows.Scan(&s.ID, &s.Name, &s.Status); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan service row"})
			return
		}
		services = append(services, s)
	}

	ctx.JSON(http.StatusOK, services)
}

func (a *Api) GetServiceByID(ctx *gin.Context) {
	clerkUserRaw, exists := ctx.Get("user")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	clerkUser := clerkUserRaw.(*middlewares.UserData)

	serviceId := ctx.Param("id")
	if serviceId == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Missing Service ID"})
		return
	}

	service, err := dbrequests.GetServiceByID(a.DB, serviceId, clerkUser.Org.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		} else {
			log.Println("error in fetching service:", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service"})
		}
		return
	}

	ctx.JSON(http.StatusOK, service)
}

func (a *Api) EditService(ctx *gin.Context) {
	clerkUserRaw, exists := ctx.Get("user")
	var service Schemas.Service

	log.Println("[EditService] Called")

	if !exists {
		log.Println("[EditService] User not found in context")
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	clerkUser := clerkUserRaw.(*middlewares.UserData)
	log.Printf("[EditService] User ID: %s, Org ID: %s, Role: %s\n", clerkUser.ID, clerkUser.Org.ID, clerkUser.Org.Role)

	if clerkUser.Org.Role != "admin" {
		log.Printf("[EditService] Unauthorized role attempt by user %s with role %s\n", clerkUser.ID, clerkUser.Org.Role)
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Only admin can perform this action"})
		return
	}

	if err := ctx.ShouldBindJSON(&service); err != nil {
		log.Printf("[EditService] Failed to bind JSON: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Request"})
		return
	}
	log.Printf("[EditService] Parsed service payload: %+v\n", service)

	err := dbrequests.EditService(a.DB, service, clerkUser.Org.ID)
	if err != nil {
		log.Printf("[EditService] Failed to update service: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[EditService] Service %s updated successfully\n", service.ID)
	ctx.JSON(http.StatusOK, gin.H{"message": "Service Updated Successfully"})

	// Broadcast to websockets
	websocketsHandler.UpdateService(strconv.Itoa(service.ID), clerkUser.Org.ID, service)
}
