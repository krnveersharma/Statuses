package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	middlewares "github.com/krnveersharma/Statuses/midlewares"
)

func (a *Api) getUser(ctx *gin.Context) {
	clerkUserRaw, exists := ctx.Get("user")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	clerkUser := clerkUserRaw.(*middlewares.UserData)

	ctx.JSON(http.StatusOK, gin.H{
		"message": clerkUser,
	})
}
