package bot

import (
	"math/rand"
	"github.com/fourinrow/backend/internal/game"
)

type Bot struct {
	Player int
}

func NewBot(player int) *Bot {
	return &Bot{Player: player}
}

func (bot *Bot) GetMove(board *game.Board) int {
	validMoves := board.GetValidMoves()
	if len(validMoves) == 0 {
		return -1
	}

	winMove := bot.findWinningMove(board, bot.Player)
	if winMove != -1 {
		return winMove
	}

	opponent := 3 - bot.Player
	blockMove := bot.findWinningMove(board, opponent)
	if blockMove != -1 {
		return blockMove
	}

	strategicMove := bot.findStrategicMove(board)
	if strategicMove != -1 {
		return strategicMove
	}

	centerCol := game.Cols / 2
	for _, col := range []int{centerCol, centerCol - 1, centerCol + 1} {
		if col >= 0 && col < game.Cols && board.IsValidMove(col) {
			return col
		}
	}

	return validMoves[rand.Intn(len(validMoves))]
}

func (bot *Bot) findWinningMove(board *game.Board, player int) int {
	for col := 0; col < game.Cols; col++ {
		if !board.IsValidMove(col) {
			continue
		}

		testBoard := board.Clone()
		testBoard.CurrentTurn = player
		
		for row := game.Rows - 1; row >= 0; row-- {
			if testBoard.Grid[row][col] == game.Empty {
				testBoard.Grid[row][col] = player
				if testBoard.CheckWin(row, col) {
					return col
				}
				break
			}
		}
	}
	return -1
}

func (bot *Bot) findStrategicMove(board *game.Board) int {
	bestCol := -1
	bestScore := -1

	for col := 0; col < game.Cols; col++ {
		if !board.IsValidMove(col) {
			continue
		}

		testBoard := board.Clone()
		testBoard.CurrentTurn = bot.Player
		
		for row := game.Rows - 1; row >= 0; row-- {
			if testBoard.Grid[row][col] == game.Empty {
				testBoard.Grid[row][col] = bot.Player
				
				score := bot.evaluatePosition(testBoard, row, col)
				
				if score > bestScore {
					bestScore = score
					bestCol = col
				}
				break
			}
		}
	}

	return bestCol
}

func (bot *Bot) evaluatePosition(board *game.Board, row, col int) int {
	score := 0
	player := bot.Player

	directions := [][2]int{
		{0, 1}, {1, 0}, {1, 1}, {1, -1},
	}

	for _, dir := range directions {
		count := 1
		openEnds := 0

		for i := 1; i < 4; i++ {
			r, c := row+dir[0]*i, col+dir[1]*i
			if r >= 0 && r < game.Rows && c >= 0 && c < game.Cols {
				if board.Grid[r][c] == player {
					count++
				} else if board.Grid[r][c] == game.Empty {
					openEnds++
					break
				} else {
					break
				}
			}
		}

		for i := 1; i < 4; i++ {
			r, c := row-dir[0]*i, col-dir[1]*i
			if r >= 0 && r < game.Rows && c >= 0 && c < game.Cols {
				if board.Grid[r][c] == player {
					count++
				} else if board.Grid[r][c] == game.Empty {
					openEnds++
					break
				} else {
					break
				}
			}
		}

		if count == 3 && openEnds > 0 {
			score += 10
		} else if count == 2 && openEnds == 2 {
			score += 5
		}
	}

	return score
}
