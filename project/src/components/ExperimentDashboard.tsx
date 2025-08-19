import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, Download, TrendingUp } from 'lucide-react';

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

interface ExperimentResult {
  timestamp: number;
  obstacleSpeed: number;
  collisions: number;
  timeToGoal: number;
  success: boolean;
  pathLength: number;
}

interface ExperimentDashboardProps {
  gameState: GameState;
  experimentResults: ExperimentResult[];
}

function ExperimentDashboard({ gameState, experimentResults }: ExperimentDashboardProps) {
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [isRunningExperiment, setIsRunningExperiment] = useState(false);

  // Simulate experiment data
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState.robot.timeToGoal > 0) {
        const avgObstacleSpeed = gameState.movingObstacles.reduce((sum, obs) => sum + obs.speed, 0) / gameState.movingObstacles.length;
        const newResult: ExperimentResult = {
          timestamp: Date.now(),
          obstacleSpeed: avgObstacleSpeed,
          collisions: gameState.robot.collisions,
          timeToGoal: gameState.robot.timeToGoal / 1000,
          success: gameState.robot.x === gameState.robot.goalX && gameState.robot.y === gameState.robot.goalY,
          pathLength: gameState.robot.path.length
        };
        
        setResults(prev => [...prev.slice(-19), newResult]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gameState]);

  const runExperiment = async () => {
    setIsRunningExperiment(true);
    // Simulate running multiple experiments
    const experimentData = [];
    
    for (let speed = 0.5; speed <= 3; speed += 0.5) {
      // Simulate data for different obstacle speeds
      const collisions = Math.floor(Math.random() * 10 + speed * 2);
      const timeToGoal = 5 + speed * 2 + Math.random() * 3;
      
      experimentData.push({
        obstacleSpeed: speed,
        avgCollisions: collisions,
        avgTimeToGoal: timeToGoal,
        successRate: Math.max(0.3, 1 - speed * 0.15)
      });
    }
    
    setTimeout(() => {
      setIsRunningExperiment(false);
    }, 3000);
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `robot_experiment_results_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const simulatedData = [
    { obstacleSpeed: 0.5, avgCollisions: 1.2, avgTimeToGoal: 6.5, successRate: 0.95 },
    { obstacleSpeed: 1.0, avgCollisions: 2.8, avgTimeToGoal: 8.2, successRate: 0.87 },
    { obstacleSpeed: 1.5, avgCollisions: 4.1, avgTimeToGoal: 10.1, successRate: 0.76 },
    { obstacleSpeed: 2.0, avgCollisions: 6.3, avgTimeToGoal: 12.8, successRate: 0.64 },
    { obstacleSpeed: 2.5, avgCollisions: 8.7, avgTimeToGoal: 15.2, successRate: 0.51 },
    { obstacleSpeed: 3.0, avgCollisions: 11.2, avgTimeToGoal: 18.5, successRate: 0.38 }
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Experiment Controls */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
            Experiment Dashboard
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={runExperiment}
              disabled={isRunningExperiment}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                isRunningExperiment
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {isRunningExperiment ? 'Running Experiment...' : 'Run Multi-Speed Experiment'}
            </button>
            
            <button
              onClick={downloadResults}
              disabled={results.length === 0}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                results.length === 0
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/25'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Results
            </button>
          </div>
        </div>

        {/* Real-time Performance Chart */}
        {results.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-gray-200">Real-time Performance</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                    contentStyle={{
                      backgroundColor: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f3f4f6'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="collisions" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Collisions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="timeToGoal" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    name="Time to Goal (s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Obstacle Speed vs Performance Analysis */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-gray-200">Obstacle Speed Impact Analysis</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulatedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="obstacleSpeed" 
                  stroke="#9ca3af"
                  fontSize={12}
                  label={{ value: 'Obstacle Speed', position: 'insideBottom', offset: -5, style: { fill: '#9ca3af' } }}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Bar dataKey="avgCollisions" fill="#ef4444" name="Avg Collisions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Success Rate Chart */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-gray-200">Success Rate by Obstacle Speed</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulatedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="obstacleSpeed" 
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12}
                  domain={[0, 1]}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Success Rate']}
                  contentStyle={{
                    backgroundColor: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  name="Success Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-400">
              {results.length}
            </div>
            <div className="text-xs text-gray-400">Total Runs</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">
              {results.length > 0 ? `${((results.filter(r => r.success).length / results.length) * 100).toFixed(0)}%` : '-'}
            </div>
            <div className="text-xs text-gray-400">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExperimentDashboard;