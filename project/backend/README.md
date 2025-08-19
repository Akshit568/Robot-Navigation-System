# Robot Navigation Backend

A Python Flask backend with WebSocket support for real-time robot navigation simulation.

## Features

- **Flask REST API** with endpoints for robot control
- **WebSocket support** for real-time communication
- **OpenCV integration** for environment visualization
- **A* pathfinding algorithm** with dynamic obstacle avoidance
- **Moving obstacles** with collision detection
- **Experiment tracking** and results visualization

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python run.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### GET /capture
Returns the current environment as a base64-encoded image with robot, obstacles, and path visualization.

**Response:**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "robot": {
    "x": 1,
    "y": 1,
    "goal_x": 18,
    "goal_y": 18,
    "path": [{"x": 1, "y": 1}, {"x": 2, "y": 1}],
    "is_moving": false,
    "collisions": 0,
    "time_to_goal": 0
  },
  "static_obstacles": [{"x": 5, "y": 5}],
  "moving_obstacles": [{"id": 0, "x": 10.5, "y": 8.2, "dx": 1.2, "dy": -0.8, "speed": 1.5}]
}
```

### POST /move
Move the robot in a specific direction.

**Request:**
```json
{
  "direction": "up"  // "up", "down", "left", "right"
}
```

### POST /reset
Reset the robot to starting position and regenerate obstacles.

### POST /moving-obstacles
Spawn moving obstacles with random motion.

**Request:**
```json
{
  "count": 5  // Number of obstacles to spawn
}
```

### POST /start
Start the robot simulation (robot begins moving toward goal).

### POST /stop
Stop the robot simulation.

### POST /set-goal
Set a new goal position for the robot.

**Request:**
```json
{
  "x": 15,
  "y": 15
}
```

### GET /results
Download experiment results as a PNG graph showing obstacle speed vs collisions.

## WebSocket Events

The server emits real-time updates via WebSocket:

### Emitted Events

- `game_state`: Current state of the environment
  ```json
  {
    "robot": {...},
    "static_obstacles": [...],
    "moving_obstacles": [...],
    "grid_size": 20
  }
  ```

### Received Events

- `start_simulation`: Start robot movement
- `stop_simulation`: Stop robot movement
- `reset_robot`: Reset robot to start
- `set_goal`: Set new goal position
- `spawn_moving_obstacles`: Spawn moving obstacles

## Environment Visualization

The `/capture` endpoint returns an OpenCV-generated image with:

- **White background**: Free space
- **Black rectangles**: Static obstacles
- **Orange circles**: Moving obstacles
- **Green rectangle**: Goal position
- **Blue circle**: Robot position
- **Cyan line**: Planned path

## Algorithm Details

### A* Pathfinding
- Implements A* algorithm for optimal path planning
- Dynamically recalculates path when obstacles move
- Avoids both static and moving obstacles
- Uses Manhattan distance heuristic

### Moving Obstacles
- Random motion with wall bouncing
- Configurable speed and count
- Real-time collision detection
- Influences path recalculation

### Experiment Tracking
- Records collision count, time to goal, success rate
- Tracks obstacle speed vs performance metrics
- Generates matplotlib graphs for analysis
- Exports results as PNG images

## Configuration

- **Grid Size**: 20x20 cells
- **Cell Size**: 30 pixels
- **Update Rate**: 10 FPS
- **Default Obstacles**: 25 static, 5 moving
- **Robot Start**: (1, 1)
- **Default Goal**: (18, 18)