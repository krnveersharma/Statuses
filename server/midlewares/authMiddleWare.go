package middlewares

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"encore.dev/beta/auth"
	"encore.dev/beta/errs"
	"github.com/clerkinc/clerk-sdk-go/clerk"
	"github.com/gin-gonic/gin"
)

type Service struct {
	client clerk.Client
}

type OrgData struct {
	ID   string `json:"id"`  // e.g., "org_abc123"
	Role string `json:"rol"` // e.g., "admin"
	Slug string `json:"slg"` // e.g., "my-org"
}

type UserData struct {
	ID                    string               `json:"id"`
	Username              *string              `json:"username,omitempty"`
	FirstName             *string              `json:"first_name,omitempty"`
	LastName              *string              `json:"last_name,omitempty"`
	ProfileImageURL       string               `json:"profile_image_url"`
	PrimaryEmailAddressID *string              `json:"primary_email_address_id,omitempty"`
	EmailAddresses        []clerk.EmailAddress `json:"email_addresses,omitempty"`

	Org            *OrgData `json:"org,omitempty"`
	ClerkSessionID string   `json:"sid,omitempty"`
	Issuer         string   `json:"iss,omitempty"`
	IssuedAt       int64    `json:"iat,omitempty"`
	ExpiresAt      int64    `json:"exp,omitempty"`
	NotBefore      int64    `json:"nbf,omitempty"`
}

// Initialize Clerk client
func InitService(ClientSecretKey string) (*Service, error) {
	client, err := clerk.NewClient(ClientSecretKey)
	if err != nil {
		return nil, err
	}
	return &Service{client: client}, nil
}

// Decode JWT token payload (for custom claims like `org`)
func DecodeJWTClaims(token string) (map[string]interface{}, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid JWT format")
	}

	payload := parts[1]
	decoded, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to decode JWT: %w", err)
	}

	var claims map[string]interface{}
	if err := json.Unmarshal(decoded, &claims); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JWT payload: %w", err)
	}

	return claims, nil
}

// AuthHandler: Clerk session verification + user fetch
func (s *Service) AuthHandler(ctx context.Context, token string, decodedClaims map[string]interface{}) (auth.UID, *UserData, error) {
	// Verify token (required to validate signature)
	sessClaims, err := s.client.VerifyToken(token)
	if err != nil {
		return "", nil, &errs.Error{
			Code:    errs.Unauthenticated,
			Message: "invalid token",
		}
	}

	// Fetch user info from Clerk
	user, err := s.client.Users().Read(sessClaims.Claims.Subject)
	if err != nil {
		return "", nil, &errs.Error{
			Code:    errs.Internal,
			Message: err.Error(),
		}
	}

	// Parse org from decoded claims (key = "o")
	var org *OrgData
	if rawOrg, ok := decodedClaims["o"].(map[string]interface{}); ok {
		org = &OrgData{}
		if id, ok := rawOrg["id"].(string); ok {
			org.ID = id
		}
		if role, ok := rawOrg["rol"].(string); ok {
			org.Role = role
		}
		if slug, ok := rawOrg["slg"].(string); ok {
			org.Slug = slug
		}
	}
	if org == nil || org.ID == "" {
		return "", nil, errors.New("user not part of current org")
	}

	// Construct UserData object
	userData := &UserData{
		ID:                    user.ID,
		Username:              user.Username,
		FirstName:             user.FirstName,
		LastName:              user.LastName,
		ProfileImageURL:       user.ProfileImageURL,
		PrimaryEmailAddressID: user.PrimaryEmailAddressID,
		EmailAddresses:        user.EmailAddresses,
		Org:                   org,
	}

	// Parse session claims from JWT (optional fields)
	if sid, ok := decodedClaims["sid"].(string); ok {
		userData.ClerkSessionID = sid
	}
	if iss, ok := decodedClaims["iss"].(string); ok {
		userData.Issuer = iss
	}
	if iat, ok := decodedClaims["iat"].(float64); ok {
		userData.IssuedAt = int64(iat)
	}
	if exp, ok := decodedClaims["exp"].(float64); ok {
		userData.ExpiresAt = int64(exp)
	}
	if nbf, ok := decodedClaims["nbf"].(float64); ok {
		userData.NotBefore = int64(nbf)
	}

	return auth.UID(user.ID), userData, nil
}

// Middleware: Validates JWT and injects `user` into context
func GetUserInfo(s *Service, allowedType string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")

		// Decode JWT claims
		decodedClaims, err := DecodeJWTClaims(token)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		log.Printf("Decoded claims: %+v\n", decodedClaims)

		// Validate and enrich user from Clerk
		_, user, err := s.AuthHandler(ctx, token, decodedClaims)

		if allowedType == "admin" && user.Org.Role != "admin" {
			return
		}

		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		// Attach to context
		ctx.Set("user", user)
		ctx.Next()
	}
}
