import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats, Html } from '@react-three/drei'
import * as THREE from 'three'
//for three installation use this "npm install react react-dom three @react-three/fiber @react-three/drei"
export default function Editor() {
  const [objects, setObjects] = useState([])
  const [hovered, setHovered] = useState(null)
  const cameraRef = useRef()
  const planeRef = useRef()
  const containerRef = useRef()
  const controlsRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('type')
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera({ x, y }, cameraRef.current)
    const [intersect] = raycaster.intersectObject(planeRef.current)
    if (intersect) {
      const { x: px, z: pz } = intersect.point
      const newPos = [Math.round(px), 0.5, Math.round(pz)]
      const id = THREE.MathUtils.generateUUID()
      setObjects((prev) => [...prev, { id, type, position: newPos }])
    }
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'r') {
        controlsRef.current.reset()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(to bottom, #111, #222, #111)',
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [10, 10, 10], fov: 50 }}
        onCreated={({ camera }) => (cameraRef.current = camera)}
      >
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 15, 10]}
          castShadow
          intensity={1}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <gridHelper args={[100, 100, 'white', '#444']} position={[0, 0.01, 0]} />
        <mesh
          ref={planeRef}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.2} />
        </mesh>

        {objects.map(({ id, type, position }) => (
          <mesh
            key={id}
            position={position}
            castShadow
            onPointerOver={() => setHovered(id)}
            onPointerOut={() => setHovered(null)}
          >
            {type === 'wall' ? (
              <boxGeometry args={[1, 1, 0.1]} />
            ) : (
              <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
            )}
            <meshStandardMaterial
              color={hovered === id ? '#ffd700' : type === 'wall' ? 'gray' : 'brown'}
              emissive={hovered === id ? '#444' : 'black'}
            />
          </mesh>
        ))}

        <axesHelper args={[5]} />
        <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.2} />
        <Stats />
      </Canvas>
    </div>
  )
}
