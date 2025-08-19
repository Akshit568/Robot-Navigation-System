import React, { useState } from 'react';
import { Play, Square, RotateCcw, Target, Zap, Settings, Activity } from 'lucide-react';

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
  movingObstacles: Array<{ id: number; x: number; y: number; dx: number; dy: number; speed: number }>;
  gridSize: number;
}

interface ControlPanelProps {
  gameState: GameState;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpawnObstacles: (count: number) => void;
}

function ControlPanel({ gameState, onStart, onStop, onReset, onSpawnObstacles }: ControlPanelProps) {
  const [obstacleCount, setObstacleCount] = useState(5);
  const { robot } = gameState;

  return (
    <div className="p-6 border-b border-gray-700">
      <div className="space-y-6">
        {/* Control Buttons */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-cyan-400" />
            Simulation Controls
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onStart}
              disabled={robot.isMoving}
              className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                robot.isMoving
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25'
              }`}
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </button>
            <button
              onClick={onStop}
              disabled={!robot.isMoving}
              className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                !robot.isMoving
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25'
              }`}
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </button>
            <button
              onClick={onReset}
              className="col-span-2 flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/25"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Environment
            </button>
          </div>
        </div>

        {/* Obstacle Controls */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-orange-400" />
            Moving Obstacles
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Obstacles: {obstacleCount}
              </label>
              <input
                type="range"
                min="1"
                max="15"
                value={obstacleCount}
                onChange={(e) => setObstacleCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <button
              onClick={() => onSpawnObstacles(obstacleCount)}
              className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all shadow-lg hover:shadow-orange-500/25"
            >
              <Zap className="w-4 h-4 mr-2" />
              Spawn {obstacleCount} Obstacles
            </button>
          </div>
        </div>

        {/* Status Display */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-cyan-400" />
            Robot Status
          </h3>
          <div className="space-y-3">
            <div className="bg-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Position:</span>
                <span className="text-white font-mono">
                  ({robot.x.toFixed(1)}, {robot.y.toFixed(1)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Goal:</span>
                <span className="text-white font-mono">
                  ({robot.goalX}, {robot.goalY})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <span className={`font-semibold ${
                  robot.isMoving ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {robot.isMoving ? 'Moving' : 'Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Path Length:</span>
                <span className="text-white">{robot.path.length} steps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-400" />
            Performance
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{robot.collisions}</div>
              <div className="text-xs text-gray-400">Collisions</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {robot.timeToGoal > 0 ? `${(robot.timeToGoal / 1000).toFixed(1)}s` : '-'}
              </div>
              <div className="text-xs text-gray-400">Time to Goal</div>
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-gray-200">Environment</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Grid Size:</span>
              <span className="text-white">{gameState.gridSize}×{gameState.gridSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Static Obstacles:</span>
              <span className="text-white">{gameState.staticObstacles.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Moving Obstacles:</span>
              <span className="text-white">{gameState.movingObstacles.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;