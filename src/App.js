import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { Dropdown } from 'react-bootstrap';

const googleScriptURL = 'https://script.google.com/macros/s/AKfycbwk-3HQQSXeNajZkNlYa3jbTY5Kr0qQ2PcF1o-M4Z1C8nrXFrEJkuU9rZjGHYwDwzdf/exec';
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
  const [showSettings, setShowSettings] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');


  const isBoardFull = useCallback((board) => board.every(square => square !== null), []);

  const sendClickData = async () => {
    try {
      const response = await axios.post(googleScriptURL, {});
      console.log(response.data);
    } catch (error) {
      console.error('Error sending click data:', error);
    }
  };

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
      setPopupMessage(`🎉 Congratulations ${currentWinner === 'X' ? 'Player 1' : (gameMode === 'bot' ? 'Aryabhatta' : 'Player 2')}! 🎉`);
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

  const getRandomMove = (board) => {
    const availableMoves = board
      .map((square, index) => (square === null ? index : null))
      .filter(index => index !== null);
    if (availableMoves.length === 0) return undefined;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };

  const transpositionTable = useMemo(() => new Map(), []);

  const getBestMoveHard = useCallback((board, player) => {
    const opponent = player === 'X' ? 'O' : 'X';

    const evaluate = (board) => {
      const winner = calculateWinner(board);
      if (winner === player) return 10;
      if (winner === opponent) return -10;
      return 0;
    };

    const isBoardFull = (board) => board.every(square => square !== null);

    const alphaBeta = (board, depth, alpha, beta, isMaximizing) => {
      const key = board.toString();
      if (transpositionTable.has(key)) return transpositionTable.get(key);

      const score = evaluate(board);
      if (score === 10 || score === -10 || isBoardFull(board)) return score - depth; // Depth penalty

      if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < board.length; i++) {
          if (board[i] === null) {
            board[i] = player;
            best = Math.max(best, alphaBeta(board, depth + 1, alpha, beta, false));
            board[i] = null;
            alpha = Math.max(alpha, best);
            if (beta <= alpha) break;
          }
        }
        transpositionTable.set(key, best);
        return best;
      } else {
        let best = Infinity;
        for (let i = 0; i < board.length; i++) {
          if (board[i] === null) {
            board[i] = opponent;
            best = Math.min(best, alphaBeta(board, depth + 1, alpha, beta, true));
            board[i] = null;
            beta = Math.min(beta, best);
            if (beta <= alpha) break;
          }
        }
        transpositionTable.set(key, best);
        return best;
      }
    };

    // Check for immediate win or block
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = player;
        if (evaluate(board) === 10) return i;
        board[i] = null;
      }
    }
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = opponent;
        if (evaluate(board) === -10) return i;
        board[i] = null;
      }
    }

    let bestMoves = [];
    let bestValue = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = player;
        const moveValue = alphaBeta(board, 0, -Infinity, Infinity, false);
        board[i] = null;
        if (moveValue > bestValue) {
          bestMoves = [i];
          bestValue = moveValue;
        } else if (moveValue === bestValue) {
          bestMoves.push(i);
        }
      }
    }

    // Randomly pick among the best moves
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }, [calculateWinner, transpositionTable]);

  const botMove = useCallback(() => {
    let bestMove;
    if (difficulty === 'noob') {
      bestMove = getRandomMove(board);
    } else if (difficulty === 'medium') {
      bestMove = getBestMove(board, isXNext ? 'O' : 'X');
    } else if (difficulty === 'hard') {
      bestMove = getBestMoveHard(board, isXNext ? 'O' : 'X');
    }
    if (bestMove !== undefined) {
      handleClick(bestMove);
    }
  }, [board, isXNext, getBestMove, handleClick, difficulty, getBestMoveHard]);

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
    sendClickData();
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
    ? `Winner: ${winner === 'X' ? 'Player 1' : (gameMode === 'bot' ? 'Aryabhatta' : 'Player 2')}`
    : ``;

  return (
    <div className="mt-5">
      <Helmet>
        <title>Tic-Tac-Toe Game</title>
        <meta name="description" content="Play Tic-Tac-Toe with a bot or another player!" />
        <meta property="og:title" content="Tic-Tac-Toe Game" />
        <meta property="og:description" content="Play Tic-Tac-Toe with a bot or another player!" />
      </Helmet>
      <div className="parent-div">
        <div className='container'>
          <h1 className="text-center mb-4">Tic-Tac-Toe</h1>
          <div className='row justify-content-center'>
            <div className='col-md-6'>
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
            </div>
          </div>
          <div className="col text-center d-flex flex-column align-items-center custom-bg">
            <h3>{gameMode === 'bot' ? 'Aryabhatta' : 'Player 2 (0)'}</h3>
            {!gameStarted && gameMode === 'bot' && (
              <div className="settings-container">
                <Dropdown show={showSettings} onToggle={() => setShowSettings(!showSettings)}>
                  <Dropdown.Toggle
                    as="div"
                    className="settings-icon"
                    onClick={() => setShowSettings(!showSettings)}
                    style={{ border: 'none', background: 'none', padding: 0 }}
                  >
                    <FontAwesomeIcon icon={faCog} />
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setDifficulty('noob')}>Noob</Dropdown.Item>
                    <Dropdown.Item onClick={() => setDifficulty('medium')}>Medium</Dropdown.Item>
                    {/* <Dropdown.Item onClick={() => setDifficulty('hard')}>Hard</Dropdown.Item> */}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            )}
          </div>
          <div className="col-auto d-flex justify-content-center align-items-center">
            <div className={`game-board ${!gameStarted ? 'disabled blur' : ''}`}>
              {board.map((_, index) => renderSquare(index))}
            </div>
          </div>
          <div className="col text-center d-flex flex-column align-items-center custom-bg">
            <h3>{'Player 1 (X)'}</h3>
          </div>

          <div className='row justify-content-center mt-3'>
            <div className='col text-center'>
              <h2>{status}</h2>
              <div className="d-flex justify-content-center mt-3">
                {gameStarted ? (
                  <button className="btn btn-secondary" onClick={resetGame}>Reset Game</button>
                ) : (
                  <button className="btn btn-primary" onClick={startGame}>Start Game</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPopup && (
        <div className='alert-on-win'>
          <div className={`popup ${fadeClass} d-flex justify-content-center`}>
            <p>{popupMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
