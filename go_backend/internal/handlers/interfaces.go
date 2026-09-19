package handlers

import (
	"context"
	"database/sql"
)

// sqlConn is a minimal interface over *sql.DB and *sql.Tx
// so helpers can work with either without importing database/sql directly.
type sqlConn interface {
	ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
}
