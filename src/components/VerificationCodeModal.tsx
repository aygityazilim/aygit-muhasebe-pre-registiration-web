import React, { useState, useRef, useEffect } from 'react'

export interface ContractCodeEntry {
  contractId: number
  label: string
}

interface VerificationCodeModalProps {
  isOpen: boolean
  phone: string
  contracts: ContractCodeEntry[]
  loading: boolean
  error: string | null
  onVerify: (codes: { contractId: number; code: string }[]) => void
  onResend: () => void
  onClose: () => void
}

const CODE_LENGTH = 6

const VerificationCodeModal: React.FC<VerificationCodeModalProps> = ({
  isOpen,
  phone,
  contracts,
  loading,
  error,
  onVerify,
  onResend,
  onClose,
}) => {
  const [allDigits, setAllDigits] = useState<string[][]>([])
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])

  useEffect(() => {
    if (isOpen) {
      setAllDigits(contracts.map(() => Array(CODE_LENGTH).fill('')))
      inputRefs.current = contracts.map(() => Array(CODE_LENGTH).fill(null))
      setTimeout(() => inputRefs.current[0]?.[0]?.focus(), 50)
    }
  }, [isOpen, contracts.length])

  if (!isOpen) return null

  const handleChange = (contractIdx: number, digitIdx: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const updated = allDigits.map(d => [...d])
    updated[contractIdx][digitIdx] = value.slice(-1)
    setAllDigits(updated)
    if (value && digitIdx < CODE_LENGTH - 1) {
      inputRefs.current[contractIdx]?.[digitIdx + 1]?.focus()
    }
  }

  const handleKeyDown = (contractIdx: number, digitIdx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !allDigits[contractIdx][digitIdx] && digitIdx > 0) {
      inputRefs.current[contractIdx]?.[digitIdx - 1]?.focus()
    }
  }

  const handlePaste = (contractIdx: number, e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (pasted.length === CODE_LENGTH) {
      const updated = allDigits.map(d => [...d])
      updated[contractIdx] = pasted.split('')
      setAllDigits(updated)
      inputRefs.current[contractIdx]?.[CODE_LENGTH - 1]?.focus()
    }
    e.preventDefault()
  }

  const allFilled = allDigits.length === contracts.length && allDigits.every(d => d.every(c => c !== ''))

  const handleSubmit = () => {
    if (!allFilled) return
    const codes = contracts.map((contract, idx) => ({
      contractId: contract.contractId,
      code: allDigits[idx].join(''),
    }))
    onVerify(codes)
  }

  const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-content-primary">Sözleşme Onayı</h2>
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
            Doğrulama kodlarınız
          </p>
          <p className="text-sm font-semibold text-content-primary text-center mb-6">
            {maskedPhone} numaralı telefona gönderildi.
          </p>

          {/* Code inputs per contract */}
          <div className="space-y-5 mb-5">
            {contracts.map((contract, contractIdx) => (
              <div key={contract.contractId}>
                <p className="text-xs font-semibold text-content-secondary mb-2">{contract.label}</p>
                <div
                  className="flex gap-2 justify-center"
                  onPaste={(e) => handlePaste(contractIdx, e)}
                >
                  {(allDigits[contractIdx] || []).map((digit, digitIdx) => (
                    <input
                      key={digitIdx}
                      ref={el => {
                        if (!inputRefs.current[contractIdx]) inputRefs.current[contractIdx] = []
                        inputRefs.current[contractIdx][digitIdx] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleChange(contractIdx, digitIdx, e.target.value)}
                      onKeyDown={e => handleKeyDown(contractIdx, digitIdx, e)}
                      disabled={loading}
                      className={`w-10 h-11 text-center text-lg font-bold rounded-xl border-2 transition-colors focus:outline-none
                        ${digit ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-border bg-surface-tertiary text-content-primary'}
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'focus:border-brand-primary'}
                      `}
                    />
                  ))}
                </div>
              </div>
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
            onClick={handleSubmit}
            disabled={!allFilled || loading}
            className="w-full bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors mb-3"
          >
            {loading ? 'Doğrulanıyor...' : 'Onayla'}
          </button>

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