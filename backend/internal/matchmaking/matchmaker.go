package matchmaking

import (
	"sync"
	"time"
)

type Player struct {
	ID       string
	Username string
	Conn     interface{}
	JoinedAt time.Time
}

type Matchmaker struct {
	waitingPlayers map[string]*Player
	mu             sync.RWMutex
	matchTimeout   time.Duration
}

func NewMatchmaker() *Matchmaker {
	return &Matchmaker{
		waitingPlayers: make(map[string]*Player),
		matchTimeout:   10 * time.Second,
	}
}

func (m *Matchmaker) AddPlayer(player *Player) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.waitingPlayers[player.ID] = player
}

func (m *Matchmaker) RemovePlayer(playerID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.waitingPlayers, playerID)
}

func (m *Matchmaker) FindMatch(playerID string) (*Player, bool) {
	m.mu.RLock()
	currentPlayer, exists := m.waitingPlayers[playerID]
	m.mu.RUnlock()

	if !exists {
		return nil, false
	}

	if time.Since(currentPlayer.JoinedAt) < m.matchTimeout {
		m.mu.RLock()
		for id, p := range m.waitingPlayers {
			if id != playerID && time.Since(p.JoinedAt) < m.matchTimeout {
				m.mu.RUnlock()
				m.mu.Lock()
				delete(m.waitingPlayers, playerID)
				delete(m.waitingPlayers, id)
				m.mu.Unlock()
				return p, true
			}
		}
		m.mu.RUnlock()
		return nil, false
	}

	m.RemovePlayer(playerID)
	return nil, true
}

func (m *Matchmaker) GetWaitingCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.waitingPlayers)
}
