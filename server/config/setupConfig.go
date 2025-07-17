package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Dsn                 string
	Port                string
	ClerkPublishableKey string
	ClerkSecretKey      string
	AllowedHost         string
}

func SetupConfig() *Config {
	godotenv.Load()
	return &Config{
		Dsn:                 os.Getenv("DSN"),
		Port:                os.Getenv("PORT"),
		ClerkPublishableKey: os.Getenv("CLERK_PUBLISHABLE_KEY"),
		ClerkSecretKey:      os.Getenv("CLERK_SECRET_KEY"),
		AllowedHost:         os.Getenv("ALLOWED_HOST"),
	}
}
