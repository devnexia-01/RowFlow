function Leaderboard({ leaderboard }) {
  if (!leaderboard || leaderboard.length === 0) {
    return null
  }

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      <ul className="leaderboard-list">
        {leaderboard.map((player, index) => (
          <li key={player.Username} className="leaderboard-item">
            <div>
              <span className="rank">#{index + 1}</span>
              <strong>{player.Username}</strong>
            </div>
            <div className="stats">
              <span>Wins: {player.Wins}</span>
              <span>Games: {player.TotalGames}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Leaderboard
