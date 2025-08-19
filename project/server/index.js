import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Robot navigation state
const GRID_SIZE = 20;
let robotState = {
  x: 1,
  y: 1,
  goalX: 18,
  goalY: 18,
  path: [],
  isMoving: false,
  collisions: 0,
  timeToGoal: 0,
  startTime: null
};

let staticObstacles = [];
let movingObstacles = [];
let simulationRunning = false;

// Generate static obstacles
function generateStaticObstacles() {
  staticObstacles = [];
  for (let i = 0; i < 25; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
    } while (
      (x === robotState.x && y === robotState.y) ||
      (x === robotState.goalX && y === robotState.goalY)
    );
    staticObstacles.push({ x, y });
  }
}

// A* pathfinding algorithm
class AStarPathfinder {
  constructor(gridSize) {
    this.gridSize = gridSize;
  }

  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  getNeighbors(node) {
    const neighbors = [];
    const directions = [
      { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 1, y: 0 }, { x: -1, y: 0 }
    ];

    for (const dir of directions) {
      const x = node.x + dir.x;
      const y = node.y + dir.y;

      if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
        neighbors.push({ x, y });
      }
    }

    return neighbors;
  }

  isObstacle(x, y) {
    return staticObstacles.some(obs => obs.x === x && obs.y === y) ||
           movingObstacles.some(obs => obs.x === x && obs.y === y);
  }

  findPath(start, goal) {
    const openSet = [start];
    const closedSet = [];
    const gScore = { [`${start.x},${start.y}`]: 0 };
    const fScore = { [`${start.x},${start.y}`]: this.heuristic(start, goal) };
    const cameFrom = {};

    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet.reduce((lowest, node) => {
        const nodeKey = `${node.x},${node.y}`;
        const lowestKey = `${lowest.x},${lowest.y}`;
        return fScore[nodeKey] < fScore[lowestKey] ? node : lowest;
      });

      if (current.x === goal.x && current.y === goal.y) {
        // Reconstruct path
        const path = [];
        let temp = current;
        while (temp) {
          path.unshift(temp);
          temp = cameFrom[`${temp.x},${temp.y}`];
        }
        return path;
      }

      openSet.splice(openSet.indexOf(current), 1);
      closedSet.push(current);

      for (const neighbor of this.getNeighbors(current)) {
        if (closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
          continue;
        }

        if (this.isObstacle(neighbor.x, neighbor.y)) {
          continue;
        }

        const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= (gScore[neighborKey] || Infinity)) {
          continue;
        }

        cameFrom[neighborKey] = current;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = tentativeGScore + this.heuristic(neighbor, goal);
      }
    }

    return []; // No path found
  }
}

const pathfinder = new AStarPathfinder(GRID_SIZE);

// Generate moving obstacles
function generateMovingObstacles(count = 5) {
  movingObstacles = [];
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
    } while (
      (x === robotState.x && y === robotState.y) ||
      (x === robotState.goalX && y === robotState.goalY) ||
      staticObstacles.some(obs => obs.x === x && obs.y === y)
    );
    
    movingObstacles.push({
      id: i,
      x,
      y,
      dx: Math.random() > 0.5 ? 1 : -1,
      dy: Math.random() > 0.5 ? 1 : -1,
      speed: 0.5 + Math.random() * 1.5
    });
  }
}

// Update moving obstacles
function updateMovingObstacles() {
  movingObstacles.forEach(obstacle => {
    if (Math.random() < 0.3) { // 30% chance to change direction
      obstacle.dx = Math.random() > 0.5 ? 1 : -1;
      obstacle.dy = Math.random() > 0.5 ? 1 : -1;
    }

    let newX = obstacle.x + obstacle.dx * obstacle.speed;
    let newY = obstacle.y + obstacle.dy * obstacle.speed;

    // Bounce off walls
    if (newX < 0 || newX >= GRID_SIZE) {
      obstacle.dx *= -1;
      newX = Math.max(0, Math.min(GRID_SIZE - 1, newX));
    }
    if (newY < 0 || newY >= GRID_SIZE) {
      obstacle.dy *= -1;
      newY = Math.max(0, Math.min(GRID_SIZE - 1, newY));
    }

    obstacle.x = newX;
    obstacle.y = newY;
  });
}

// Check collision
function checkCollision(x, y) {
  const robotRadius = 0.5;
  return movingObstacles.some(obstacle => {
    const distance = Math.sqrt(
      Math.pow(x - obstacle.x, 2) + Math.pow(y - obstacle.y, 2)
    );
    return distance < robotRadius + 0.5;
  });
}

// Move robot along path
function moveRobot() {
  if (!robotState.isMoving || robotState.path.length <= 1) {
    return;
  }

  // Remove current position from path
  robotState.path.shift();
  
  if (robotState.path.length > 0) {
    const nextPos = robotState.path[0];
    robotState.x = nextPos.x;
    robotState.y = nextPos.y;

    // Check for collision
    if (checkCollision(robotState.x, robotState.y)) {
      robotState.collisions++;
    }

    // Check if reached goal
    if (robotState.x === robotState.goalX && robotState.y === robotState.goalY) {
      robotState.isMoving = false;
      robotState.timeToGoal = Date.now() - robotState.startTime;
    }
  }
}

// Recalculate path
function recalculatePath() {
  const start = { x: robotState.x, y: robotState.y };
  const goal = { x: robotState.goalX, y: robotState.goalY };
  robotState.path = pathfinder.findPath(start, goal);
}

// Initialize environment
generateStaticObstacles();
generateMovingObstacles();
recalculatePath();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');

  // Send initial state
  socket.emit('gameState', {
    robot: robotState,
    staticObstacles,
    movingObstacles,
    gridSize: GRID_SIZE
  });

  socket.on('startSimulation', () => {
    robotState.isMoving = true;
    robotState.startTime = Date.now();
    simulationRunning = true;
    recalculatePath();
  });

  socket.on('stopSimulation', () => {
    robotState.isMoving = false;
    simulationRunning = false;
  });

  socket.on('resetRobot', () => {
    robotState.x = 1;
    robotState.y = 1;
    robotState.isMoving = false;
    robotState.collisions = 0;
    robotState.timeToGoal = 0;
    robotState.startTime = null;
    simulationRunning = false;
    generateMovingObstacles();
    recalculatePath();
  });

  socket.on('setGoal', (position) => {
    robotState.goalX = position.x;
    robotState.goalY = position.y;
    recalculatePath();
  });

  socket.on('spawnMovingObstacles', (count) => {
    generateMovingObstacles(count || 5);
    recalculatePath();
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Game loop
let lastUpdate = Date.now();
setInterval(() => {
  const now = Date.now();
  const deltaTime = (now - lastUpdate) / 1000;
  lastUpdate = now;

  if (simulationRunning) {
    updateMovingObstacles();
    
    // Recalculate path every 500ms or when obstacles move significantly
    if (Math.random() < 0.1) {
      recalculatePath();
    }
    
    moveRobot();

    // Broadcast updated state
    io.emit('gameState', {
      robot: robotState,
      staticObstacles,
      movingObstacles,
      gridSize: GRID_SIZE
    });
  }
}, 100); // 10 FPS

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});