from flask import Flask, request, jsonify, send_file
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
import base64
import io
import threading
import time
import random
import json
from datetime import datetime
import matplotlib.pyplot as plt
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'robot_navigation_secret'
socketio = SocketIO(app, cors_allowed_origins="*")

# Environment configuration
GRID_SIZE = 20
CELL_SIZE = 30
IMAGE_SIZE = GRID_SIZE * CELL_SIZE

# Robot state
robot_state = {
    'x': 1,
    'y': 1,
    'goal_x': 18,
    'goal_y': 18,
    'path': [],
    'is_moving': False,
    'collisions': 0,
    'time_to_goal': 0,
    'start_time': None
}

# Obstacles
static_obstacles = []
moving_obstacles = []
simulation_running = False

# Experiment results
experiment_results = []

class AStarPathfinder:
    def __init__(self, grid_size):
        self.grid_size = grid_size
    
    def heuristic(self, a, b):
        return abs(a[0] - b[0]) + abs(a[1] - b[1])
    
    def get_neighbors(self, node):
        neighbors = []
        directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
        
        for dx, dy in directions:
            x, y = node[0] + dx, node[1] + dy
            if 0 <= x < self.grid_size and 0 <= y < self.grid_size:
                neighbors.append((x, y))
        
        return neighbors
    
    def is_obstacle(self, x, y):
        # Check static obstacles
        for obs in static_obstacles:
            if obs['x'] == x and obs['y'] == y:
                return True
        
        # Check moving obstacles (with some tolerance)
        for obs in moving_obstacles:
            if abs(obs['x'] - x) < 0.8 and abs(obs['y'] - y) < 0.8:
                return True
        
        return False
    
    def find_path(self, start, goal):
        open_set = [start]
        closed_set = set()
        g_score = {start: 0}
        f_score = {start: self.heuristic(start, goal)}
        came_from = {}
        
        while open_set:
            current = min(open_set, key=lambda x: f_score.get(x, float('inf')))
            
            if current == goal:
                # Reconstruct path
                path = []
                while current in came_from:
                    path.append({'x': current[0], 'y': current[1]})
                    current = came_from[current]
                path.append({'x': start[0], 'y': start[1]})
                return list(reversed(path))
            
            open_set.remove(current)
            closed_set.add(current)
            
            for neighbor in self.get_neighbors(current):
                if neighbor in closed_set or self.is_obstacle(neighbor[0], neighbor[1]):
                    continue
                
                tentative_g_score = g_score[current] + 1
                
                if neighbor not in open_set:
                    open_set.append(neighbor)
                elif tentative_g_score >= g_score.get(neighbor, float('inf')):
                    continue
                
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                f_score[neighbor] = tentative_g_score + self.heuristic(neighbor, goal)
        
        return []

pathfinder = AStarPathfinder(GRID_SIZE)

def generate_static_obstacles():
    global static_obstacles
    static_obstacles = []
    
    for _ in range(25):
        while True:
            x = random.randint(0, GRID_SIZE - 1)
            y = random.randint(0, GRID_SIZE - 1)
            
            # Don't place obstacles on robot start or goal positions
            if (x == robot_state['x'] and y == robot_state['y']) or \
               (x == robot_state['goal_x'] and y == robot_state['goal_y']):
                continue
            
            static_obstacles.append({'x': x, 'y': y})
            break

def generate_moving_obstacles(count=5):
    global moving_obstacles
    moving_obstacles = []
    
    for i in range(count):
        while True:
            x = random.randint(0, GRID_SIZE - 1)
            y = random.randint(0, GRID_SIZE - 1)
            
            # Don't place on robot or goal
            if (x == robot_state['x'] and y == robot_state['y']) or \
               (x == robot_state['goal_x'] and y == robot_state['goal_y']):
                continue
            
            # Don't place on static obstacles
            if any(obs['x'] == x and obs['y'] == y for obs in static_obstacles):
                continue
            
            moving_obstacles.append({
                'id': i,
                'x': float(x),
                'y': float(y),
                'dx': random.choice([-1, 1]) * (0.5 + random.random()),
                'dy': random.choice([-1, 1]) * (0.5 + random.random()),
                'speed': 0.5 + random.random() * 1.5
            })
            break

def update_moving_obstacles():
    for obstacle in moving_obstacles:
        # Random direction change
        if random.random() < 0.1:
            obstacle['dx'] = random.choice([-1, 1]) * obstacle['speed']
            obstacle['dy'] = random.choice([-1, 1]) * obstacle['speed']
        
        # Update position
        new_x = obstacle['x'] + obstacle['dx'] * 0.1
        new_y = obstacle['y'] + obstacle['dy'] * 0.1
        
        # Bounce off walls
        if new_x < 0 or new_x >= GRID_SIZE:
            obstacle['dx'] *= -1
            new_x = max(0, min(GRID_SIZE - 1, new_x))
        
        if new_y < 0 or new_y >= GRID_SIZE:
            obstacle['dy'] *= -1
            new_y = max(0, min(GRID_SIZE - 1, new_y))
        
        obstacle['x'] = new_x
        obstacle['y'] = new_y

def create_environment_image():
    # Create white background
    img = np.ones((IMAGE_SIZE, IMAGE_SIZE, 3), dtype=np.uint8) * 255
    
    # Draw grid lines
    for i in range(GRID_SIZE + 1):
        cv2.line(img, (i * CELL_SIZE, 0), (i * CELL_SIZE, IMAGE_SIZE), (200, 200, 200), 1)
        cv2.line(img, (0, i * CELL_SIZE), (IMAGE_SIZE, i * CELL_SIZE), (200, 200, 200), 1)
    
    # Draw static obstacles (black)
    for obs in static_obstacles:
        x1 = obs['x'] * CELL_SIZE + 2
        y1 = obs['y'] * CELL_SIZE + 2
        x2 = (obs['x'] + 1) * CELL_SIZE - 2
        y2 = (obs['y'] + 1) * CELL_SIZE - 2
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 0), -1)
    
    # Draw moving obstacles (orange)
    for obs in moving_obstacles:
        center_x = int(obs['x'] * CELL_SIZE + CELL_SIZE // 2)
        center_y = int(obs['y'] * CELL_SIZE + CELL_SIZE // 2)
        cv2.circle(img, (center_x, center_y), CELL_SIZE // 3, (0, 165, 255), -1)
    
    # Draw goal (green)
    goal_x1 = robot_state['goal_x'] * CELL_SIZE + 5
    goal_y1 = robot_state['goal_y'] * CELL_SIZE + 5
    goal_x2 = (robot_state['goal_x'] + 1) * CELL_SIZE - 5
    goal_y2 = (robot_state['goal_y'] + 1) * CELL_SIZE - 5
    cv2.rectangle(img, (goal_x1, goal_y1), (goal_x2, goal_y2), (0, 255, 0), -1)
    
    # Draw path (cyan line)
    if len(robot_state['path']) > 1:
        for i in range(len(robot_state['path']) - 1):
            start_point = (
                int(robot_state['path'][i]['x'] * CELL_SIZE + CELL_SIZE // 2),
                int(robot_state['path'][i]['y'] * CELL_SIZE + CELL_SIZE // 2)
            )
            end_point = (
                int(robot_state['path'][i + 1]['x'] * CELL_SIZE + CELL_SIZE // 2),
                int(robot_state['path'][i + 1]['y'] * CELL_SIZE + CELL_SIZE // 2)
            )
            cv2.line(img, start_point, end_point, (255, 255, 0), 3)
    
    # Draw robot (blue)
    robot_center_x = int(robot_state['x'] * CELL_SIZE + CELL_SIZE // 2)
    robot_center_y = int(robot_state['y'] * CELL_SIZE + CELL_SIZE // 2)
    cv2.circle(img, (robot_center_x, robot_center_y), CELL_SIZE // 3, (255, 0, 0), -1)
    
    return img

def recalculate_path():
    start = (robot_state['x'], robot_state['y'])
    goal = (robot_state['goal_x'], robot_state['goal_y'])
    robot_state['path'] = pathfinder.find_path(start, goal)

def check_collision():
    robot_x, robot_y = robot_state['x'], robot_state['y']
    
    for obs in moving_obstacles:
        distance = ((robot_x - obs['x']) ** 2 + (robot_y - obs['y']) ** 2) ** 0.5
        if distance < 1.0:
            return True
    
    return False

def move_robot():
    if not robot_state['is_moving'] or len(robot_state['path']) <= 1:
        return
    
    # Move to next position in path
    if len(robot_state['path']) > 1:
        next_pos = robot_state['path'][1]
        robot_state['x'] = next_pos['x']
        robot_state['y'] = next_pos['y']
        robot_state['path'].pop(0)
        
        # Check for collision
        if check_collision():
            robot_state['collisions'] += 1
        
        # Check if reached goal
        if robot_state['x'] == robot_state['goal_x'] and robot_state['y'] == robot_state['goal_y']:
            robot_state['is_moving'] = False
            robot_state['time_to_goal'] = time.time() - robot_state['start_time']

# API Endpoints
@app.route('/capture', methods=['GET'])
def capture():
    img = create_environment_image()
    
    # Convert to base64
    _, buffer = cv2.imencode('.png', img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return jsonify({
        'image': f'data:image/png;base64,{img_base64}',
        'robot': robot_state,
        'static_obstacles': static_obstacles,
        'moving_obstacles': moving_obstacles
    })

@app.route('/move', methods=['POST'])
def move():
    data = request.get_json()
    direction = data.get('direction')
    
    new_x, new_y = robot_state['x'], robot_state['y']
    
    if direction == 'up' and new_y > 0:
        new_y -= 1
    elif direction == 'down' and new_y < GRID_SIZE - 1:
        new_y += 1
    elif direction == 'left' and new_x > 0:
        new_x -= 1
    elif direction == 'right' and new_x < GRID_SIZE - 1:
        new_x += 1
    
    # Check if new position is valid (not an obstacle)
    if not pathfinder.is_obstacle(new_x, new_y):
        robot_state['x'] = new_x
        robot_state['y'] = new_y
        recalculate_path()
    
    return jsonify({'success': True, 'robot': robot_state})

@app.route('/reset', methods=['POST'])
def reset():
    robot_state['x'] = 1
    robot_state['y'] = 1
    robot_state['is_moving'] = False
    robot_state['collisions'] = 0
    robot_state['time_to_goal'] = 0
    robot_state['start_time'] = None
    
    generate_static_obstacles()
    generate_moving_obstacles()
    recalculate_path()
    
    return jsonify({'success': True, 'robot': robot_state})

@app.route('/moving-obstacles', methods=['POST'])
def spawn_moving_obstacles():
    data = request.get_json()
    count = data.get('count', 5)
    
    generate_moving_obstacles(count)
    recalculate_path()
    
    return jsonify({'success': True, 'moving_obstacles': moving_obstacles})

@app.route('/start', methods=['POST'])
def start_simulation():
    robot_state['is_moving'] = True
    robot_state['start_time'] = time.time()
    recalculate_path()
    
    return jsonify({'success': True, 'robot': robot_state})

@app.route('/stop', methods=['POST'])
def stop_simulation():
    robot_state['is_moving'] = False
    
    return jsonify({'success': True, 'robot': robot_state})

@app.route('/set-goal', methods=['POST'])
def set_goal():
    data = request.get_json()
    robot_state['goal_x'] = data.get('x', robot_state['goal_x'])
    robot_state['goal_y'] = data.get('y', robot_state['goal_y'])
    recalculate_path()
    
    return jsonify({'success': True, 'robot': robot_state})

@app.route('/results', methods=['GET'])
def get_results():
    # Generate experiment results graph
    if not experiment_results:
        return jsonify({'error': 'No experiment results available'})
    
    # Create matplotlib graph
    speeds = [r['obstacle_speed'] for r in experiment_results]
    collisions = [r['collisions'] for r in experiment_results]
    
    plt.figure(figsize=(10, 6))
    plt.scatter(speeds, collisions, alpha=0.7, s=50)
    plt.xlabel('Obstacle Speed')
    plt.ylabel('Number of Collisions')
    plt.title('Obstacle Speed vs Collisions')
    plt.grid(True, alpha=0.3)
    
    # Save graph
    graph_path = 'experiment_results.png'
    plt.savefig(graph_path, dpi=300, bbox_inches='tight')
    plt.close()
    
    return send_file(graph_path, as_attachment=True)

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('game_state', {
        'robot': robot_state,
        'static_obstacles': static_obstacles,
        'moving_obstacles': moving_obstacles,
        'grid_size': GRID_SIZE
    })

@socketio.on('start_simulation')
def handle_start():
    robot_state['is_moving'] = True
    robot_state['start_time'] = time.time()
    recalculate_path()

@socketio.on('stop_simulation')
def handle_stop():
    robot_state['is_moving'] = False

@socketio.on('reset_robot')
def handle_reset():
    robot_state['x'] = 1
    robot_state['y'] = 1
    robot_state['is_moving'] = False
    robot_state['collisions'] = 0
    robot_state['time_to_goal'] = 0
    robot_state['start_time'] = None
    generate_moving_obstacles()
    recalculate_path()

@socketio.on('set_goal')
def handle_set_goal(data):
    robot_state['goal_x'] = data['x']
    robot_state['goal_y'] = data['y']
    recalculate_path()

@socketio.on('spawn_moving_obstacles')
def handle_spawn_obstacles(data):
    count = data.get('count', 5)
    generate_moving_obstacles(count)
    recalculate_path()

# Background simulation loop
def simulation_loop():
    global simulation_running
    
    while True:
        if robot_state['is_moving']:
            update_moving_obstacles()
            
            # Recalculate path occasionally
            if random.random() < 0.1:
                recalculate_path()
            
            move_robot()
            
            # Emit updated state
            socketio.emit('game_state', {
                'robot': robot_state,
                'static_obstacles': static_obstacles,
                'moving_obstacles': moving_obstacles,
                'grid_size': GRID_SIZE
            })
            
            # Record experiment data
            if robot_state['time_to_goal'] > 0:
                avg_speed = sum(obs['speed'] for obs in moving_obstacles) / len(moving_obstacles) if moving_obstacles else 0
                experiment_results.append({
                    'timestamp': datetime.now().isoformat(),
                    'obstacle_speed': avg_speed,
                    'collisions': robot_state['collisions'],
                    'time_to_goal': robot_state['time_to_goal'],
                    'success': robot_state['x'] == robot_state['goal_x'] and robot_state['y'] == robot_state['goal_y']
                })
        
        time.sleep(0.1)  # 10 FPS

# Initialize environment
generate_static_obstacles()
generate_moving_obstacles()
recalculate_path()

# Start background simulation
simulation_thread = threading.Thread(target=simulation_loop, daemon=True)
simulation_thread.start()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)