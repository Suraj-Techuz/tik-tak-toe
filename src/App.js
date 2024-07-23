import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Helmet } from 'react-helmet';

const initialBoard = Array(9).fill(null);

function App() {
  const [board, setBoard] = useState(initialBoard);
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [fadeClass, setFadeClass] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [clickedIndices, setClickedIndices] = useState(new Set());
  const [winningLine, setWinningLine] = useState([]);
  const [gameMode, setGameMode] = useState('bot'); // 'bot' or 'player'

  useEffect(() => {
    if (showPopup) {
      setFadeClass('fade-in');
      setTimeout(() => {
        setFadeClass('fade-out');
        setTimeout(() => setShowPopup(false), 500);
      }, 2000);
    }
  }, [showPopup]);

  const handleClick = useCallback((index) => {
    if (!gameStarted || board[index] || winner) return;
    const newBoard = board.slice();
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setClickedIndices(new Set(clickedIndices.add(index)));

    const currentWinner = calculateWinner(newBoard);
    if (currentWinner) {
      const winLine = getWinningLine(newBoard);
      setWinningLine(winLine);
      setWinner(currentWinner);
      setPopupMessage(`🎉 Congratulations ${currentWinner === 'X' ? 'Player 1' : (gameMode === 'bot' ? 'Bot' : 'Player 2')}! 🎉`);
      setShowPopup(true);
      setFadeClass('');
    } else if (isBoardFull(newBoard)) {
      setPopupMessage('🌟 It\'s a Draw! 🌟');
      setShowPopup(true);
      setFadeClass('');
    } else {
      setIsXNext(!isXNext);
    }
  }, [gameStarted, board, winner, isXNext, clickedIndices, gameMode]);

  const botMove = useCallback(() => {
    const emptyIndices = board
      .map((value, index) => (value === null ? index : null))
      .filter(index => index !== null);
    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    if (randomIndex !== undefined) {
      handleClick(randomIndex);
    }
  }, [board, handleClick]);

  useEffect(() => {
    if (gameStarted && !isXNext && gameMode === 'bot') {
      const timer = setTimeout(() => {
        botMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameStarted, botMove, gameMode]);

  const isBoardFull = (board) => board.every(square => square !== null);

  const getWinningLine = (board) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return [a, b, c];
      }
    }
    return [];
  };

  const calculateWinner = (board) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const renderSquare = (index) => (
    <button
      className={`square ${clickedIndices.has(index) ? 'selected' : ''} ${winningLine.includes(index) ? 'winning' : ''}`}
      onClick={() => handleClick(index)}
      key={index}
    >
      {board[index]}
    </button>
  );

  const startGame = () => {
    setGameStarted(true);
    setIsXNext(gameMode === 'bot'); // Bot starts first if game mode is 'bot'
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setIsXNext(true);
    setWinner(null);
    setShowPopup(false);
    setGameStarted(false);
    setClickedIndices(new Set());
    setWinningLine([]);
  };

  const status = winner
    ? `Winner: ${winner === 'X' ? 'Player 1' : (gameMode === 'bot' ? 'Bot' : 'Player 2')}`
    : ``;

  return (
    <div className="container mt-5">
      <Helmet>
        <title>Tic-Tac-Toe Game</title>
        <meta name="description" content="Play Tic-Tac-Toe with a bot or another player!" />
        <meta property="og:title" content="Tic-Tac-Toe Game" />
        <meta property="og:description" content="Play Tic-Tac-Toe with a bot or another player!" />
      </Helmet>
      <div class="parent-div">
        <h1 className="text-center mb-4">Tic-Tac-Toe</h1>
        <div className="text-center mt-3">
          <div className="input-container">
            <select
              className="form-control mb-2"
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value)}
              disabled={gameStarted}
            >
              <option value="bot">Play with Bot</option>
              <option value="player">Play with Another Player</option>
            </select>
          </div>
        </div>
        <div className="text-center mt-3">
          <div className="text-center position-relative">
            <div className={`game-board ${!gameStarted ? 'disabled' : ''} ${!gameStarted ? 'blur' : ''}`}>
              {board.map((_, index) => renderSquare(index))}
            </div>
          </div>
        </div>
        <div className="text-center mt-3">
          <h2>{status}</h2>
          {gameStarted && (
            <div className="button-container mt-3">
              <button className="btn btn-secondary" onClick={resetGame}>
                Reset Game
              </button>

            </div>
          )}
          {!gameStarted && (
            <button
              className="btn btn-primary start-button"
              onClick={startGame}
            >
              Start Game
            </button>
          )}
        </div>
      </div>
      {showPopup && (
        <div className={`popup-overlay ${fadeClass}`}>
          <div className="popup-content">
            <h2>{popupMessage}</h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
