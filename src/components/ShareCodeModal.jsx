import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { generateSaveCode } from '../utils/saveCode'

export default function ShareCodeModal({ profile, onClose }) {
  const [code, setCode] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const generated = await generateSaveCode(profile)
        if (cancelled) return
        setCode(generated)
        const url = `${window.location.origin}${window.location.pathname}#/?import=${encodeURIComponent(generated)}`
        const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: '#1e1b4b', light: '#ffffff' } })
        if (!cancelled) setQrDataUrl(dataUrl)
      } catch {
        if (!cancelled) setError('No se pudo generar el código.')
      }
    }
    run()
    return () => { cancelled = true }
  }, [profile])

  const handleCopy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API not available — the code is still selectable/visible on screen
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-gradient-to-br from-indigo-950 to-purple-900 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center"
        initial={{ scale: 0.7 }} animate={{ scale: 1 }}
      >
        <div className="text-4xl mb-2">📤</div>
        <div className="font-title text-white text-xl mb-1">Continuar en otro dispositivo</div>
        <div className="font-body text-white/60 text-sm mb-4">
          Escanea este código QR con el otro dispositivo, o escribe el código a mano.
        </div>

        {error && <div className="font-body text-red-300 text-sm mb-4">{error}</div>}

        {!error && (
          <>
            <div className="bg-white rounded-2xl p-3 mx-auto w-fit mb-4 min-h-[200px] min-w-[200px] flex items-center justify-center">
              {qrDataUrl
                ? <img src={qrDataUrl} alt="Código QR de progreso" width={200} height={200} />
                : <div className="text-indigo-900/50 font-body text-sm">Generando…</div>}
            </div>

            <div className="bg-black/30 rounded-xl px-4 py-3 mb-4 font-mono text-amber-300 text-sm sm:text-base tracking-wider break-all">
              {code || '···· ···· ···· ····'}
            </div>

            <motion.button
              onClick={handleCopy}
              disabled={!code}
              className="w-full bg-amber-400 text-indigo-950 font-title px-6 py-3 rounded-full mb-3 disabled:opacity-40"
              whileTap={{ scale: 0.97 }}
            >
              {copied ? '¡Copiado! ✓' : 'Copiar código'}
            </motion.button>
          </>
        )}

        <motion.button
          onClick={onClose}
          className="w-full bg-white/10 text-white font-title px-6 py-3 rounded-full"
          whileTap={{ scale: 0.97 }}
        >CERRAR</motion.button>
      </motion.div>
    </motion.div>
  )
}
