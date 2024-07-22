import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const initialBoard = Array(9).fill(null);

function App() {
  const [board, setBoard] = useState(initialBoard);
  const [isXNext, setIsXNext] = useState(true); // Bot starts first
  const [winner, setWinner] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [fadeClass, setFadeClass] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('Player 1');
  const [clickedIndices, setClickedIndices] = useState(new Set());
  const [winningLine, setWinningLine] = useState([]); // Track the winning line

  useEffect(() => {
    if (showPopup) {
      setFadeClass('fade-in');
      setTimeout(() => {
        setTimeout(() => {
          setFadeClass('fade-out');
        }, 2000); // Hide popup after 5 seconds
        setTimeout(() => setShowPopup(false), 2500); // Hide popup after fade-out duration
      }, 100); // Delay for fade-in effect
    }
  }, [showPopup]);

  useEffect(() => {
    if (gameStarted && !isXNext) {
      botMove();
    }
  }, [isXNext, gameStarted]);

  const handleClick = (index) => {
    if (!gameStarted || board[index] || winner) return;
    const newBoard = board.slice();
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setClickedIndices(new Set(clickedIndices.add(index))); // Mark the square as clicked

    const currentWinner = calculateWinner(newBoard);

    if (currentWinner) {
      const winLine = getWinningLine(newBoard); // Get the winning line
      setWinningLine(winLine); // Set the winning line
      setWinner(currentWinner);

      // Set the correct congratulatory message
      setPopupMessage(`🎉 Congratulations ${currentWinner === 'X' ? playerName : 'Bot'}! 🎉`);
      setShowPopup(true);
      setFadeClass(''); // Reset fade class for new popup
    } else if (isBoardFull(newBoard)) {
      setPopupMessage('🌟 It\'s a Draw! 🌟');
      setShowPopup(true);
      setFadeClass(''); // Reset fade class for new popup
    } else {
      setIsXNext(!isXNext);
    }
  };

  const botMove = () => {
    // Add a 1-second delay before the bot makes its move
    setTimeout(() => {
      const emptyIndices = board
        .map((value, index) => (value === null ? index : null))
        .filter(index => index !== null);
      const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      if (randomIndex !== undefined) {
        handleClick(randomIndex);
      }
    }, 1000);
  };

  const isBoardFull = (board) => {
    return board.every(square => square !== null);
  };

  const getWinningLine = (board) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
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
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
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
    setIsXNext(true); // Bot starts first
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setIsXNext(true);
    setWinner(null);
    setShowPopup(false);
    setGameStarted(false);
    setClickedIndices(new Set()); // Reset clicked indices
    setWinningLine([]); // Clear the winning line
  };

  const status = winner
    ? `Winner: ${winner === 'X' ? 'Bot' : playerName}`
    : `Next player: ${isXNext ? playerName : 'Bot'}`;

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Tic-Tac-Toe</h1>
      <div className="row justify-content-center mb-4">
        <div className="col-md-3">
          <div className="input-container">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6 text-center">
          <div className="text-center position-relative">
            <div className={`game-board ${!gameStarted ? 'blur' : ''}`}>
              {board.map((_, index) => renderSquare(index))}
            </div>
            {!gameStarted && (
              <button
                className="btn btn-primary start-button position-absolute top-50 start-50 translate-middle"
                style={{ zIndex: 1 }}
                onClick={startGame}
              >
                Start Game
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="text-center mt-3">
        <h2>{status}</h2>
        {gameStarted && (
          <button className="btn btn-secondary mt-3" onClick={resetGame}>
            Reset Game
          </button>
        )}
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
