import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Particles } from './Particles'

export default function App() {
  return (
    <Canvas>
      <Particles />
      <OrbitControls />
    </Canvas>
  )
}