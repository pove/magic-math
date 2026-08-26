import { Suspense, lazy } from 'react'
import useCastleViewMode from '../hooks/useCastleViewMode'
import CastleScreen2D from './CastleScreen2D'

// three.js + fiber/drei are only paid for by devices that actually render the 3D castle.
const CastleScreen3D = lazy(() => import('./CastleScreen3D'))

export default function CastleScreen() {
  const viewMode = useCastleViewMode()

  if (viewMode.mode === '3d') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-[#0b0620]" />}>
        <CastleScreen3D viewMode={viewMode} />
      </Suspense>
    )
  }

  return <CastleScreen2D viewMode={viewMode} />
}
