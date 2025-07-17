package dbconnection

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/krnveersharma/Statuses/config"
	_ "github.com/lib/pq"
)

func SetupDbConnection(config config.Config) (*sql.DB, error) {
	db, err := sql.Open("postgres", config.Dsn)
	if err != nil {
		return nil, errors.New(err.Error())
	}

	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("Unable to connect to the database due to error: %s DSN is: %s", err.Error(), config.Dsn)
	}

	return db, nil
}
