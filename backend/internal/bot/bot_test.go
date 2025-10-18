package bot

import (
        "testing"
        "github.com/fourinrow/backend/internal/game"
)

func TestNewBot(t *testing.T) {
        bot := NewBot(game.Player2)
        
        if bot.Player != game.Player2 {
                t.Errorf("Expected bot player to be Player2, got %d", bot.Player)
        }
}

func TestBotMakesValidMove(t *testing.T) {
        board := game.NewBoard()
        bot := NewBot(game.Player2)
        
        board.CurrentTurn = game.Player2
        column := bot.GetMove(board)
        
        if column < 0 || column >= game.Cols {
                t.Errorf("Expected valid column, got %d", column)
        }
        
        if !board.IsValidMove(column) {
                t.Errorf("Bot chose invalid move: column %d", column)
        }
}

func TestBotBlocksOpponentWin(t *testing.T) {
        board := game.NewBoard()
        bot := NewBot(game.Player2)
        
        board.MakeMove(0)
        board.MakeMove(0)
        board.MakeMove(1)
        board.MakeMove(1)
        board.MakeMove(2)
        
        board.CurrentTurn = game.Player2
        column := bot.GetMove(board)
        
        if column != 3 {
                t.Errorf("Expected bot to block at column 3, got %d", column)
        }
}

func TestBotTakesWinningMove(t *testing.T) {
        board := game.NewBoard()
        bot := NewBot(game.Player2)
        
        board.MakeMove(4)
        board.MakeMove(0)
        board.MakeMove(5)
        board.MakeMove(1)
        board.MakeMove(6)
        board.MakeMove(2)
        
        board.CurrentTurn = game.Player2
        column := bot.GetMove(board)
        
        if column != 3 {
                t.Errorf("Expected bot to win at column 3, got %d", column)
        }
}

func TestBotHandlesFullBoard(t *testing.T) {
        board := game.NewBoard()
        bot := NewBot(game.Player2)
        
        for col := 0; col < game.Cols; col++ {
                for row := 0; row < game.Rows; row++ {
                        board.Grid[row][col] = game.Player1
                }
        }
        
        column := bot.GetMove(board)
        
        if column != -1 {
                t.Errorf("Expected bot to return -1 for full board, got %d", column)
        }
}
