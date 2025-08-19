import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface GameState {
  robot: {
    x: number;
    y: number;
    goalX: number;
    goalY: number;
    path: Array<{ x: number; y: number }>;
    isMoving: boolean;
    collisions: number;
    timeToGoal: number;
  };
  staticObstacles: Array<{ x: number; y: number }>;
  movingObstacles: Array<{ 
    id: number; 
    x: number; 
    y: number; 
    dx: number; 
    dy: number; 
    speed: number 
  }>;
  gridSize: number;
}

export function useSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Try to connect to Python backend first, fallback to Node.js server
    const pythonBackendUrl = 'http://localhost:5000';
    const nodeBackendUrl = 'http://localhost:3001';
    
    const connectToBackend = (url: string) => {
      const socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      socket.on('connect', () => {
        console.log(`Connected to backend at ${url}`);
        setConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from backend');
        setConnected(false);
      });

      socket.on('gameState', (state: GameState) => {
        setGameState(state);
      });

      socket.on('game_state', (state: GameState) => {
        setGameState(state);
      });

      socket.on('connect_error', (error) => {
        console.log(`Failed to connect to ${url}:`, error);
        if (url === pythonBackendUrl) {
          console.log('Trying Node.js backend...');
          socket.disconnect();
          connectToBackend(nodeBackendUrl);
        }
      });

      return socket;
    };

    socketRef.current = connectToBackend(pythonBackendUrl);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startSimulation = () => {
    if (socketRef.current) {
      socketRef.current.emit('start_simulation');
      socketRef.current.emit('startSimulation');
    }
  };

  const stopSimulation = () => {
    if (socketRef.current) {
      socketRef.current.emit('stop_simulation');
      socketRef.current.emit('stopSimulation');
    }
  };

  const resetRobot = () => {
    if (socketRef.current) {
      socketRef.current.emit('reset_robot');
      socketRef.current.emit('resetRobot');
    }
  };

  const setGoal = (x: number, y: number) => {
    if (socketRef.current) {
      socketRef.current.emit('set_goal', { x, y });
      socketRef.current.emit('setGoal', { x, y });
    }
  };

  const spawnObstacles = (count: number) => {
    if (socketRef.current) {
      socketRef.current.emit('spawn_moving_obstacles', { count });
      socketRef.current.emit('spawnMovingObstacles', { count });
    }
  };

  return {
    gameState,
    connected,
    startSimulation,
    stopSimulation,
    resetRobot,
    setGoal,
    spawnObstacles,
  };
}