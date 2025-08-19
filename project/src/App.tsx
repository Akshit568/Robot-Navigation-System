import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Target, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from './hooks/useSocket';
import RobotScene from './components/RobotScene';
import ControlPanel from './components/ControlPanel';
import ExperimentDashboard from './components/ExperimentDashboard';

function App() {
  const { gameState, connected, startSimulation, stopSimulation, resetRobot, setGoal, spawnObstacles } = useSocket();
  const [activeTab, setActiveTab] = useState<'controls' | 'experiments'>('controls');

  // Default state for when backend is not connected
  const defaultGameState = {
    robot: {
      x: 1,
      y: 1,
      goalX: 18,
      goalY: 18,
      path: [],
      isMoving: false,
      collisions: 0,
      timeToGoal: 0,
    },
    staticObstacles: [
      { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 },
      { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 },
      { x: 15, y: 12 }, { x: 16, y: 12 }, { x: 17, y: 12 },
      { x: 3, y: 15 }, { x: 4, y: 15 }, { x: 5, y: 15 },
    ],
    movingObstacles: [],
    gridSize: 20,
  };

  const currentGameState = gameState || defaultGameState;

  const handleSetGoal = (x: number, y: number) => {
    setGoal(x, y);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Robot Navigation System
              </h1>
              <p className="text-sm text-gray-400">Real-time 3D Path Planning & Obstacle Avoidance</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {connected ? (
              <>
                <Wifi className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm font-medium">Backend Offline</span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* 3D Scene */}
        <div className="flex-1 bg-gray-900 relative">
          <Canvas
            camera={{ position: [25, 20, 25], fov: 50 }}
            className="w-full h-full"
          >
            <color attach="background" args={['#111827']} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
            <directionalLight position={[-10, 10, -5]} intensity={0.3} />
            
            <RobotScene gameState={currentGameState} onSetGoal={handleSetGoal} />
            
            <OrbitControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={true}
              maxPolarAngle={Math.PI / 2.2}
              minDistance={10}
              maxDistance={50}
            />
          </Canvas>
          
          {/* Connection Status Overlay */}
          {!connected && (
            <div className="absolute top-4 left-4 bg-red-900/80 backdrop-blur-sm border border-red-500/50 rounded-lg px-4 py-2">
              <p className="text-red-200 text-sm">
                Python backend not running. Start with: <code className="bg-red-800/50 px-1 rounded">python backend/run.py</code>
              </p>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('controls')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'controls'
                  ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Controls
            </button>
            <button
              onClick={() => setActiveTab('experiments')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'experiments'
                  ? 'bg-gray-700 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Experiments
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'controls' ? (
            <ControlPanel
              gameState={currentGameState}
              onStart={startSimulation}
              onStop={stopSimulation}
              onReset={resetRobot}
              onSpawnObstacles={spawnObstacles}
            />
          ) : (
            <ExperimentDashboard
              gameState={currentGameState}
              experimentResults={[]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;