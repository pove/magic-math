import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Torch, StoneFloor, Column } from './kit'

/**
 * 3D take on floor 2, "La Biblioteca Mágica": warm wood-and-candlelight
 * library with tall bookshelves, a reading carpet, and books that pop off
 * the shelves to hover and page themselves in mid-air.
 */

const SHELF_BOOK_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777']

function Bookshelf({ position, mirrored = false }) {
  const rows = 4
  const cols = 9
  const shelfW = 4.4
  const shelfH = 5.2
  return (
    <group position={position} scale={[mirrored ? -1 : 1, 1, 1]}>
      <mesh position={[0, shelfH / 2, 0]}>
        <boxGeometry args={[shelfW, shelfH, 0.9]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} />
      </mesh>
      {Array.from({ length: rows }, (_, row) => (
        <group key={row} position={[0, 0.75 + row * 1.28, 0.42]}>
          <mesh>
            <boxGeometry args={[shelfW - 0.3, 0.08, 0.08]} />
            <meshStandardMaterial color="#3a230f" />
          </mesh>
          {Array.from({ length: cols }, (_, b) => {
            const bh = 0.75 + ((b * 17 + row * 7) % 5) * 0.08
            const color = SHELF_BOOK_COLORS[(b + row) % SHELF_BOOK_COLORS.length]
            return (
              <mesh key={b} position={[-shelfW / 2 + 0.4 + b * (shelfW - 0.8) / (cols - 1), bh / 2 + 0.04, 0]}>
                <boxGeometry args={[0.16, bh, 0.5]} />
                <meshStandardMaterial color={color} roughness={0.7} />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

// A magic book, hovering open like a little tent: two chunky covers hinged
// on a spine that swing open/closed around the vertical (Y) axis — real
// book depth, not a flat fan — with a cream page-block on each cover's
// inner face so the pages actually read as paper, not more cover color.
// It bobs, slowly turns to show off its shape, and sheds a trail of light
// sparkles from the spine.
function FloatingBook({ position, speed = 1, color = '#dc2626' }) {
  const group = useRef()
  const coverL = useRef()
  const coverR = useRef()
  const sparkle = useRef()
  const coverColorR = useMemo(() => new THREE.Color(color).offsetHSL(0, 0, -0.1), [color])
  const w = 0.5
  const h = 0.64
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(t * 0.9) * 0.35
      group.current.rotation.y = Math.sin(t * 0.5) * 0.6
    }
    // covers gently breathe open/closed around the spine, never fully flat
    const open = 0.4 + Math.sin(t * 1.1) * 0.14
    if (coverL.current) coverL.current.rotation.y = open
    if (coverR.current) coverR.current.rotation.y = -open
    if (sparkle.current) {
      const cy = (Math.sin(t * 1.5) * 0.5 + 0.5)
      sparkle.current.position.y = 0.34 + cy * 1.0
      sparkle.current.material.opacity = 1 - cy
    }
  })
  return (
    <group ref={group} position={position}>
      <group ref={coverL}>
        <mesh position={[-w / 2, 0, -0.05]}>
          <boxGeometry args={[w, h, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        <mesh position={[-w / 2, 0, 0.02]}>
          <boxGeometry args={[w * 0.9, h * 0.88, 0.1]} />
          <meshStandardMaterial color="#fdf6e3" roughness={0.95} />
        </mesh>
      </group>
      <group ref={coverR}>
        <mesh position={[w / 2, 0, -0.05]}>
          <boxGeometry args={[w, h, 0.05]} />
          <meshStandardMaterial color={coverColorR} roughness={0.55} />
        </mesh>
        <mesh position={[w / 2, 0, 0.02]}>
          <boxGeometry args={[w * 0.9, h * 0.88, 0.1]} />
          <meshStandardMaterial color="#fffaf0" roughness={0.95} />
        </mesh>
      </group>
      <mesh>
        <boxGeometry args={[0.08, h, 0.16]} />
        <meshStandardMaterial color="#fde68a" roughness={0.5} />
      </mesh>
      <mesh ref={sparkle} position={[0, 0.34, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#fde047" transparent opacity={1} />
      </mesh>
    </group>
  )
}

export default function LibraryRoom({ accent = '#f59e0b' }) {
  const books = useMemo(
    () => [
      { position: [-3, 3.2, -9], speed: 0.8, color: '#dc2626' },
      { position: [2.5, 4, -8.4], speed: 1.05, color: '#b91c1c' },
      { position: [0, 2.6, -7.6], speed: 0.65, color: '#7c3aed' },
      { position: [-1.6, 4.4, -10.2], speed: 0.9, color: '#2563eb' },
    ],
    []
  )

  return (
    <group>
      <color attach="background" args={['#2a1708']} />
      <fog attach="fog" args={['#2a1708', 14, 40]} />

      {/* back wall */}
      <mesh position={[0, 3.5, -13]}>
        <boxGeometry args={[26, 8, 1]} />
        <meshStandardMaterial color="#4a2c12" roughness={0.9} />
      </mesh>

      <Bookshelf position={[-7.5, 0, -12.3]} />
      <Bookshelf position={[7.5, 0, -12.3]} mirrored />
      <Bookshelf position={[-11.5, 0, -11.6]} />
      <Bookshelf position={[11.5, 0, -11.6]} mirrored />

      <Column position={[-4.2, 0, -10.6]} height={5.6} />
      <Column position={[4.2, 0, -10.6]} height={5.6} />

      {books.map((b, i) => (
        <FloatingBook key={i} {...b} />
      ))}

      <Torch position={[-2.4, 0, -9.4]} />
      <Torch position={[2.4, 0, -9.4]} />

      {/* reading carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -3]}>
        <planeGeometry args={[4.6, 9]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -3]}>
        <ringGeometry args={[2.1, 2.25, 4]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
      </mesh>

      <pointLight position={[0, 5, 0]} color={accent} intensity={0.55} distance={22} />
      <pointLight position={[0, 4.5, -9]} color="#fde68a" intensity={0.9} distance={14} />

      <StoneFloor />
    </group>
  )
}
