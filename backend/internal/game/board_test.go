package game

import "testing"

func TestNewBoard(t *testing.T) {
        board := NewBoard()
        
        if board.CurrentTurn != Player1 {
                t.Errorf("Expected current turn to be Player1, got %d", board.CurrentTurn)
        }
        
        if board.MovesCount != 0 {
                t.Errorf("Expected moves count to be 0, got %d", board.MovesCount)
        }
        
        if board.GameOver {
                t.Error("Expected game to not be over")
        }
}

func TestIsValidMove(t *testing.T) {
        board := NewBoard()
        
        if !board.IsValidMove(0) {
                t.Error("Expected column 0 to be valid")
        }
        
        if !board.IsValidMove(6) {
                t.Error("Expected column 6 to be valid")
        }
        
        if board.IsValidMove(-1) {
                t.Error("Expected column -1 to be invalid")
        }
        
        if board.IsValidMove(7) {
                t.Error("Expected column 7 to be invalid")
        }
}

func TestMakeMove(t *testing.T) {
        board := NewBoard()
        
        move, err := board.MakeMove(3)
        if err != nil {
                t.Fatalf("Expected move to succeed, got error: %v", err)
        }
        
        if move.Column != 3 {
                t.Errorf("Expected column 3, got %d", move.Column)
        }
        
        if move.Row != 5 {
                t.Errorf("Expected row 5 (bottom), got %d", move.Row)
        }
        
        if move.Player != Player1 {
                t.Errorf("Expected Player1, got %d", move.Player)
        }
        
        if board.CurrentTurn != Player2 {
                t.Errorf("Expected turn to switch to Player2, got %d", board.CurrentTurn)
        }
}

func TestCheckWinHorizontal(t *testing.T) {
        board := NewBoard()
        
        for i := 0; i < 4; i++ {
                board.MakeMove(i)
                if i < 3 {
                        board.MakeMove(i)
                }
        }
        
        if !board.GameOver {
                t.Error("Expected game to be over after horizontal win")
        }
        
        if board.Winner != Player1 {
                t.Errorf("Expected Player1 to win, got %d", board.Winner)
        }
}

func TestCheckWinVertical(t *testing.T) {
        board := NewBoard()
        
        for i := 0; i < 4; i++ {
                board.MakeMove(0)
                if i < 3 {
                        board.MakeMove(1)
                }
        }
        
        if !board.GameOver {
                t.Error("Expected game to be over after vertical win")
        }
        
        if board.Winner != Player1 {
                t.Errorf("Expected Player1 to win, got %d", board.Winner)
        }
}

func TestCheckWinDiagonal(t *testing.T) {
        board := NewBoard()
        
        board.MakeMove(0)
        board.MakeMove(1)
        board.MakeMove(1)
        board.MakeMove(2)
        board.MakeMove(2)
        board.MakeMove(3)
        board.MakeMove(2)
        board.MakeMove(3)
        board.MakeMove(3)
        board.MakeMove(0)
        board.MakeMove(3)
        
        if !board.GameOver {
                t.Error("Expected game to be over after diagonal win")
        }
}

func TestFullColumn(t *testing.T) {
        board := NewBoard()
        
        for i := 0; i < Rows; i++ {
                board.MakeMove(0)
        }
        
        if board.IsValidMove(0) {
                t.Error("Expected column 0 to be full")
        }
        
        _, err := board.MakeMove(0)
        if err == nil {
                t.Error("Expected error when making move in full column")
        }
}

func TestGetValidMoves(t *testing.T) {
        board := NewBoard()
        
        validMoves := board.GetValidMoves()
        if len(validMoves) != Cols {
                t.Errorf("Expected %d valid moves, got %d", Cols, len(validMoves))
        }
        
        for i := 0; i < Rows; i++ {
                board.MakeMove(0)
        }
        
        validMoves = board.GetValidMoves()
        if len(validMoves) != Cols-1 {
                t.Errorf("Expected %d valid moves, got %d", Cols-1, len(validMoves))
        }
}
