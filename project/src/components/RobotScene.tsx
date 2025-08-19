import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

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

interface RobotSceneProps {
  gameState: GameState;
  onSetGoal: (x: number, y: number) => void;
}

function Robot({ position, isMoving }: { position: [number, number, number]; isMoving: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * (isMoving ? 2 : 0.5);
      
      // Add subtle floating animation when moving
      if (isMoving) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      } else {
        meshRef.current.position.y = position[1];
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial 
        color="#06b6d4"
        emissive="#0891b2"
        emissiveIntensity={0.2}
        metalness={0.8}
        roughness={0.2}
      />
      {/* Robot eyes */}
      <mesh position={[0.2, 0.1, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.2, 0.1, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </mesh>
  );
}

function StaticObstacle({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.8, 1, 0.8]} />
      <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

function MovingObstacle({ position, speed }: { position: [number, number, number]; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed;
      meshRef.current.rotation.z = state.clock.elapsedTime * speed * 0.5;
      
      // Pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial 
        color="#f97316"
        emissive="#ea580c"
        emissiveIntensity={0.3}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  );
}

function Goal({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <cylinderGeometry args={[0.4, 0.4, 0.8, 6]} />
        <meshStandardMaterial 
          color="#22c55e"
          emissive="#16a34a"
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      <Text
        position={[position[0], position[1] + 1.5, position[2]]}
        fontSize={0.5}
        color="#22c55e"
        anchorX="center"
        anchorY="middle"
      >
        GOAL
      </Text>
    </group>
  );
}

function PathLine({ path }: { path: Array<{ x: number; y: number }> }) {
  const points = path.map(p => new THREE.Vector3(p.x, 0.1, p.y));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#06b6d4" linewidth={3} />
    </line>
  );
}

function RobotScene({ gameState, onSetGoal }: RobotSceneProps) {
  const { robot, staticObstacles, movingObstacles } = gameState;
  const { camera, gl } = useThree();

  // Handle click events for setting goals
  const handleClick = (event: any) => {
    event.stopPropagation();
    
    // Convert mouse position to world coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Create a plane at y=0 to intersect with
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(plane, intersection)) {
      const x = Math.round(Math.max(0, Math.min(gameState.gridSize - 1, intersection.x)));
      const z = Math.round(Math.max(0, Math.min(gameState.gridSize - 1, intersection.z)));
      
      // Check if position is not occupied by obstacles
      const isObstacle = staticObstacles.some(obs => obs.x === x && obs.y === z) ||
                        movingObstacles.some(obs => Math.abs(obs.x - x) < 1 && Math.abs(obs.y - z) < 1);
      
      if (!isObstacle) {
        onSetGoal(x, z);
      }
    }
  };

  return (
    <group onClick={handleClick}>
      {/* Ground plane for click detection */}
      <mesh position={[gameState.gridSize/2, -0.1, gameState.gridSize/2]} visible={false}>
        <planeGeometry args={[gameState.gridSize, gameState.gridSize]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Grid lines */}
      <group>
        {Array.from({ length: gameState.gridSize + 1 }, (_, i) => (
          <group key={`grid-${i}`}>
            {/* Horizontal lines */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([0, 0, i, gameState.gridSize, 0, i])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#374151" />
            </line>
            {/* Vertical lines */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([i, 0, 0, i, 0, gameState.gridSize])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#374151" />
            </line>
          </group>
        ))}
      </group>

      {/* Robot */}
      <Robot 
        position={[robot.x, 0.5, robot.y]} 
        isMoving={robot.isMoving}
      />

      {/* Goal */}
      <Goal position={[robot.goalX, 0.5, robot.goalY]} />

      {/* Static obstacles */}
      {staticObstacles.map((obstacle, index) => (
        <StaticObstacle
          key={`static-${index}`}
          position={[obstacle.x, 0.5, obstacle.y]}
        />
      ))}

      {/* Moving obstacles */}
      {movingObstacles.map((obstacle) => (
        <MovingObstacle
          key={`moving-${obstacle.id}`}
          position={[obstacle.x, 0.3, obstacle.y]}
          speed={obstacle.speed}
        />
      ))}

      {/* Path visualization */}
      {robot.path.length > 1 && <PathLine path={robot.path} />}

      {/* Instructions */}
      {!robot.isMoving && (
        <Text
          position={[gameState.gridSize/2, 2, gameState.gridSize/2]}
          fontSize={0.8}
          color="#06b6d4"
          anchorX="center"
          anchorY="middle"
        >
          Click to set goal • Press Start to begin
        </Text>
      )}
    </group>
  );
}

export default RobotScene;