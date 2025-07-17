package main

import (
	"log"

	"github.com/krnveersharma/Statuses/api"
	"github.com/krnveersharma/Statuses/config"
)

func main() {
	config := config.SetupConfig()
	err := api.SetupApi(*config)
	if err != nil {
		log.Fatal(err)
	}
}
