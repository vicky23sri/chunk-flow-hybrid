package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"chunkflow-backend/internal/config"
	"chunkflow-backend/internal/routes"
	"chunkflow-backend/internal/scheduler"

	_ "github.com/lib/pq"
)

func main() {
	// 1. Load centralized configuration
	cfg := config.LoadConfig()

	// 2. Start Automated Cron Engine
	scheduler.StartScheduler()

	// 3. Setup Gin Router & Register Routes
	router := routes.SetupRouter(cfg)

	// 3. Configure HTTP Server
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         serverAddr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 4. Start Server in background goroutine
	go func() {
		log.Printf("🚀 ChunkFlow Go Backend running on http://localhost:%s (env: %s)\n", cfg.Port, cfg.AppEnv)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server failed to start: %v\n", err)
		}
	}()

	// 5. Listen for OS Signals for Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down ChunkFlow Go Backend server...")

	// 6. Shutdown context with 5-second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v\n", err)
	}

	log.Println("Server exiting gracefully.")
}
