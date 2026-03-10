import React, { useState, useRef, useEffect } from 'react'

interface VerificationCodeModalProps {
  isOpen: boolean
  phone: string
  loading: boolean
  error: string | null
  onVerify: (code: string) => void
  onResend: () => void
  onClose: () => void
}

const VerificationCodeModal: React.FC<VerificationCodeModalProps> = ({
  isOpen,
  phone,
  loading,
  error,
  onVerify,
  onResend,
  onClose,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    if (newDigits.every(d => d !== '') && newDigits[index] !== '') {
      onVerify(newDigits.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newDigits = pasted.split('')
      setDigits(newDigits)
      inputRefs.current[5]?.focus()
      onVerify(pasted)
    }
    e.preventDefault()
  }

  const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-content-primary">Kimlik Doğrulama</h2>
          <button
            onClick={onClose}
            className="text-content-tertiary hover:text-content-secondary transition-colors p-1 rounded-lg hover:bg-surface-secondary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-center w-12 h-12 bg-brand-primary/10 rounded-full mb-4 mx-auto">
            <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <p className="text-sm text-content-secondary text-center mb-1">
            Doğrulama kodunuz
          </p>
          <p className="text-sm font-semibold text-content-primary text-center mb-6">
            {maskedPhone} numaralı telefona gönderildi.
          </p>

          {/* Code inputs */}
          <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                className={`w-11 h-12 text-center text-xl font-bold rounded-xl border-2 transition-colors focus:outline-none
                  ${digit ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-border bg-surface-tertiary text-content-primary'}
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'focus:border-brand-primary'}
                `}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 bg-status-error-bg border border-status-error/30 text-status-error rounded-xl px-4 py-2.5 text-sm text-center">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-content-tertiary mb-4">
              <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              Doğrulanıyor...
            </div>
          )}

          <button
            onClick={onResend}
            disabled={loading}
            className="w-full text-sm text-brand-secondary hover:text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center"
          >
            Kodu tekrar gönder
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerificationCodeModal
