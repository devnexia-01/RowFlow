package game

import "errors"

const (
	Rows    = 6
	Cols    = 7
	Empty   = 0
	Player1 = 1
	Player2 = 2
)

type Board struct {
	Grid         [Rows][Cols]int
	CurrentTurn  int
	MovesCount   int
	LastMove     *Move
	GameOver     bool
	Winner       int
}

type Move struct {
	Column int
	Row    int
	Player int
}

func NewBoard() *Board {
	return &Board{
		Grid:        [Rows][Cols]int{},
		CurrentTurn: Player1,
		MovesCount:  0,
		GameOver:    false,
		Winner:      Empty,
	}
}

func (b *Board) IsValidMove(col int) bool {
	if col < 0 || col >= Cols {
		return false
	}
	return b.Grid[0][col] == Empty
}

func (b *Board) MakeMove(col int) (*Move, error) {
	if !b.IsValidMove(col) {
		return nil, errors.New("invalid move")
	}

	for row := Rows - 1; row >= 0; row-- {
		if b.Grid[row][col] == Empty {
			b.Grid[row][col] = b.CurrentTurn
			move := &Move{
				Column: col,
				Row:    row,
				Player: b.CurrentTurn,
			}
			b.LastMove = move
			b.MovesCount++

			if b.CheckWin(row, col) {
				b.GameOver = true
				b.Winner = b.CurrentTurn
			} else if b.MovesCount == Rows*Cols {
				b.GameOver = true
				b.Winner = Empty
			}

			b.CurrentTurn = 3 - b.CurrentTurn
			return move, nil
		}
	}

	return nil, errors.New("column full")
}

func (b *Board) CheckWin(row, col int) bool {
	player := b.Grid[row][col]
	
	directions := [][2]int{
		{0, 1},  // Horizontal
		{1, 0},  // Vertical
		{1, 1},  // Diagonal /
		{1, -1}, // Diagonal \
	}

	for _, dir := range directions {
		count := 1
		
		for i := 1; i < 4; i++ {
			r, c := row+dir[0]*i, col+dir[1]*i
			if r >= 0 && r < Rows && c >= 0 && c < Cols && b.Grid[r][c] == player {
				count++
			} else {
				break
			}
		}
		
		for i := 1; i < 4; i++ {
			r, c := row-dir[0]*i, col-dir[1]*i
			if r >= 0 && r < Rows && c >= 0 && c < Cols && b.Grid[r][c] == player {
				count++
			} else {
				break
			}
		}

		if count >= 4 {
			return true
		}
	}

	return false
}

func (b *Board) GetValidMoves() []int {
	validMoves := []int{}
	for col := 0; col < Cols; col++ {
		if b.IsValidMove(col) {
			validMoves = append(validMoves, col)
		}
	}
	return validMoves
}

func (b *Board) Clone() *Board {
	clone := &Board{
		Grid:        b.Grid,
		CurrentTurn: b.CurrentTurn,
		MovesCount:  b.MovesCount,
		GameOver:    b.GameOver,
		Winner:      b.Winner,
	}
	if b.LastMove != nil {
		clone.LastMove = &Move{
			Column: b.LastMove.Column,
			Row:    b.LastMove.Row,
			Player: b.LastMove.Player,
		}
	}
	return clone
}
