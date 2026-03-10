import React from 'react'

interface PdfModalProps {
  isOpen: boolean
  title: string
  pdfUrl: string
  onRequestVerification: () => void
  onClose: () => void
}

const PdfModal: React.FC<PdfModalProps> = ({ isOpen, title, pdfUrl, onRequestVerification, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-content-tertiary hover:text-content-secondary transition-colors p-1 rounded-lg hover:bg-surface-secondary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden p-4">
          <iframe
            src={pdfUrl}
            className="w-full h-full rounded-lg border border-border"
            style={{ minHeight: '400px' }}
            title={title}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            onClick={() => {
              onRequestVerification()
              onClose()
            }}
            className="bg-brand-primary hover:bg-brand-secondary text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Okudum Anladım
          </button>
        </div>
      </div>
    </div>
  )
}

export default PdfModal
