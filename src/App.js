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

  const isBoardFull = useCallback((board) => board.every(square => square !== null), []);

  const calculateWinner = useCallback((board) => {
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
  }, []);

  const getWinningLine = useCallback((board) => {
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
  }, []);

  const getBestMove = useCallback((board, player) => {
    const opponent = player === 'X' ? 'O' : 'X';

    const evaluate = (board) => {
      const winner = calculateWinner(board);
      if (winner === player) return 10;
      if (winner === opponent) return -10;
      return 0;
    };

    const minimax = (board, depth, isMaximizing) => {
      const score = evaluate(board);
      if (score === 10) return score - depth;
      if (score === -10) return score + depth;
      if (isBoardFull(board)) return 0;

      if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < board.length; i++) {
          if (board[i] === null) {
            board[i] = player;
            best = Math.max(best, minimax(board, depth + 1, !isMaximizing));
            board[i] = null;
          }
        }
        return best;
      } else {
        let best = Infinity;
        for (let i = 0; i < board.length; i++) {
          if (board[i] === null) {
            board[i] = opponent;
            best = Math.min(best, minimax(board, depth + 1, !isMaximizing));
            board[i] = null;
          }
        }
        return best;
      }
    };

    let bestMove = undefined;
    let bestValue = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = player;
        const moveValue = minimax(board, 0, false);
        board[i] = null;
        if (moveValue > bestValue) {
          bestMove = i;
          bestValue = moveValue;
        }
      }
    }

    return bestMove;
  }, [isBoardFull, calculateWinner]);

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
  }, [gameStarted, board, winner, isXNext, clickedIndices, gameMode, calculateWinner, isBoardFull, getWinningLine]);

  const botMove = useCallback(() => {
    const bestMove = getBestMove(board, isXNext ? 'O' : 'X');
    if (bestMove !== undefined) {
      handleClick(bestMove);
    }
  }, [board, isXNext, getBestMove, handleClick]);

  useEffect(() => {
    if (showPopup) {
      setFadeClass('fade-in');
      setTimeout(() => {
        setFadeClass('fade-out');
        setTimeout(() => setShowPopup(false), 500);
      }, 2000);
    }
  }, [showPopup]);

  useEffect(() => {
    if (gameStarted && !isXNext && gameMode === 'bot') {
      const timer = setTimeout(() => {
        botMove();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameStarted, botMove, gameMode]);

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
      <div className="parent-div">
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
              <button className="btn btn-secondary" onClick={resetGame}>Reset Game</button>
            </div>
          )}
          {!gameStarted && (
            <div className="button-container mt-3">
              <button className="btn btn-primary" onClick={startGame}>Start Game</button>
            </div>
          )}
        </div>
        {showPopup && (
          <div className={`popup ${fadeClass}`}>
            <p>{popupMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
