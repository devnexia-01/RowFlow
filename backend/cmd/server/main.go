package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/fourinrow/backend/internal/database"
	"github.com/fourinrow/backend/internal/kafka"
	ws "github.com/fourinrow/backend/internal/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Server struct {
	hub    *ws.Hub
	db     *database.DB
	kafka  *kafka.Producer
}

func main() {
	db, err := database.NewDB()
	if err != nil {
		log.Printf("Database connection failed: %v - continuing without DB", err)
	}

	kafkaProducer, err := kafka.NewProducer()
	if err != nil {
		log.Printf("Kafka connection failed: %v - continuing without Kafka", err)
		kafkaProducer = nil
	}

	hub := ws.NewHub(db, kafkaProducer)

	server := &Server{
		hub:   hub,
		db:    db,
		kafka: kafkaProducer,
	}

	r := mux.NewRouter()

	r.HandleFunc("/ws", server.handleWebSocket)
	r.HandleFunc("/api/leaderboard", server.handleLeaderboard).Methods("GET")
	r.HandleFunc("/api/health", server.handleHealth).Methods("GET")

	r.PathPrefix("/").Handler(http.FileServer(http.Dir("../frontend/dist")))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	go s.hub.HandleClient(conn)
}

func (s *Server) handleLeaderboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	leaderboard, err := s.hub.GetLeaderboard()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(leaderboard)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
