import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import { clearTrackingNumber, setApplication } from '../state/applicationSlice'
import type { RegistrationStatus, ContractVerificationType } from '../state/applicationSlice'
import { PreRegistrationAPI } from '../api/preRegistration'
import AygitLogo from '../components/AygitLogo'
import PdfModal from '../components/PdfModal'
import VerificationCodeModal from '../components/VerificationCodeModal'

const CONTRACT_LABELS: Record<ContractVerificationType, { label: string; desc: string }> = {
  kvkk: { label: 'KVKK Aydınlatma Metni', desc: 'Kişisel verilerinizin işlenmesine ilişkin aydınlatma metnini okudum.' },
  etk: { label: 'ETK Onay Metni', desc: 'Elektronik ticari ileti gönderilmesine ilişkin onay metnini okudum ve kabul ediyorum.' },
}

const STATUS_CONFIG: Record<RegistrationStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: {
    label: 'Beklemede',
    bg: 'bg-status-warning-bg',
    text: 'text-status-warning',
    dot: 'bg-status-warning',
  },
  quoted: {
    label: 'Teklif Verildi',
    bg: 'bg-status-info-bg',
    text: 'text-status-info',
    dot: 'bg-status-info',
  },
  done: {
    label: 'Tamamlandı',
    bg: 'bg-status-success-bg',
    text: 'text-status-success',
    dot: 'bg-status-success',
  },
}


const TrackingPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { trackingNumber, application } = useAppSelector(s => s.application)

  const [loadingStatus, setLoadingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const [taxPlateFile, setTaxPlateFile] = useState<File | null>(null)
  const [otherFiles, setOtherFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const acceptedAgreements = Object.fromEntries(
    (application?.contracts ?? []).map(c => [c.id, !!c.verified_code])
  )
  const [pdfModal, setPdfModal] = useState<{ open: boolean; title: string; url: string; contractId: number } | null>(null)
  const [verifyModal, setVerifyModal] = useState<{ contractId: number; phone: string } | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const taxPlateRef = useRef<HTMLInputElement>(null)
  const otherFilesRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!trackingNumber) {
      navigate('/')
      return
    }
    fetchStatus()
  }, [trackingNumber])

  const fetchStatus = async () => {
    if (!trackingNumber) return
    setLoadingStatus(true)
    setStatusError(null)
    try {
      const res = await PreRegistrationAPI.getByTrackingNumber(trackingNumber)
      dispatch(setApplication(res.data.data))
    } catch {
      setStatusError('Başvuru bilgileri alınamadı.')
    } finally {
      setLoadingStatus(false)
    }
  }

  const handleClearTracking = () => {
    dispatch(clearTrackingNumber())
    navigate('/')
  }

  const handleOtherFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setOtherFiles(prev => [...prev, ...Array.from(e.target.files!)])
      setUploadSuccess(false)
    }
  }

  const removeOtherFile = (idx: number) => {
    setOtherFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUpload = async () => {
    if (!taxPlateFile && otherFiles.length === 0) {
      setUploadError('Lütfen en az bir dosya seçin.')
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    try {
      const formData = new FormData()
      if (taxPlateFile) formData.append('tax_plate', taxPlateFile)
      otherFiles.forEach(f => formData.append('other', f))
      await PreRegistrationAPI.uploadDocuments(trackingNumber!, formData)
      setUploadSuccess(true)
      setTaxPlateFile(null)
      setOtherFiles([])
      await fetchStatus()
    } catch {
      setUploadError('Belgeler yüklenirken hata oluştu.')
    } finally {
      setUploading(false)
    }
  }

  const handleAgreementClick = (contractId: number, title: string, url: string) => {
    setPdfModal({ open: true, title, url, contractId })
  }

  const handleRequestVerification = async (contractId: number) => {
    try {
      await PreRegistrationAPI.sendVerificationCode(trackingNumber!, contractId)
      setVerifyError(null)
      setVerifyModal({ contractId, phone: application!.phone })
    } catch {
      setVerifyError('Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.')
    }
  }

  const handleVerifyCode = async (code: string) => {
    if (!verifyModal) return
    setVerifyLoading(true)
    setVerifyError(null)
    try {
      await PreRegistrationAPI.verifyContractCode(trackingNumber!, verifyModal.contractId, code)
      setVerifyModal(null)
      await fetchStatus()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      setVerifyError(axiosError?.response?.data?.error || 'Doğrulama kodu hatalı.')
    } finally {
      setVerifyLoading(false)
    }
  }

  const statusCfg = application ? STATUS_CONFIG[application.status] : null

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Header */}
      <div className="bg-gradient-hero px-6 py-8 flex items-center justify-between">
        <AygitLogo color="#6AD140" width={160} />
        <button
          onClick={handleClearTracking}
          className="flex items-center gap-2 text-sm text-content-tertiary hover:text-white border border-white/20 hover:border-white/40 px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Farklı Başvuru Sorgula
        </button>
      </div>

      <div className="flex-1 px-4 py-8 flex flex-col items-center gap-6">
        {/* Application Status Card */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-content-primary">Başvuru Durumu</h2>
              <p className="text-sm text-content-tertiary mt-0.5">Takip No: <span className="font-mono font-medium text-content-secondary">{trackingNumber}</span></p>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="flex items-center gap-1.5 text-sm text-brand-secondary hover:text-brand-primary border border-brand-primary/30 hover:border-brand-primary px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yenile
            </button>
          </div>

          {statusError && (
            <div className="bg-status-error-bg border border-status-error/30 text-status-error rounded-xl px-4 py-2.5 text-sm mb-4">
              {statusError}
            </div>
          )}

          {application ? (
            <div className="space-y-3">
              {/* Status Badge */}
              {statusCfg && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusCfg.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                  <span className={`text-sm font-medium ${statusCfg.text}`}>{statusCfg.label}</span>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {application.name && (
                  <div>
                    <p className="text-xs text-content-tertiary uppercase tracking-wide mb-0.5">Ad Soyad</p>
                    <p className="text-sm font-medium text-content-primary">{application.name} {application.surname}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-content-tertiary uppercase tracking-wide mb-0.5">Telefon</p>
                  <p className="text-sm font-medium text-content-primary">{application.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-content-tertiary uppercase tracking-wide mb-0.5">Başvuru Tarihi</p>
                  <p className="text-sm font-medium text-content-primary">
                    {new Date(application.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              {application.message && (
                <div className="mt-2">
                  <p className="text-xs text-content-tertiary uppercase tracking-wide mb-0.5">Mesaj</p>
                  <p className="text-sm text-content-secondary bg-surface-secondary rounded-lg px-3 py-2">{application.message}</p>
                </div>
              )}
            </div>
          ) : loadingStatus ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <p className="text-sm text-content-tertiary py-4 text-center">Bilgiler yükleniyor...</p>
          )}
        </div>

        {/* Document Upload */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-1">Belge Yükleme</h2>
          <p className="text-sm text-content-secondary mb-5">Vergi levhanızı ve gerekli diğer belgelerinizi yükleyin.</p>

          {/* Already uploaded documents */}
          {application?.document && (
            <div className="mb-6 space-y-2">
              <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wide mb-3">Yüklenen Belgeler</p>
              {application.document.tax_plate && (
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL}/documents/uploads/${application.document.tax_plate}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-status-success-bg border border-status-success/20 rounded-xl px-4 py-3 hover:border-status-success/50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-status-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content-primary">Vergi Levhası</p>
                    <p className="text-xs text-content-tertiary truncate">{application.document.tax_plate.split('/').pop()}</p>
                  </div>
                  <svg className="w-4 h-4 text-content-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {application.document.other && application.document.other.length > 0 && application.document.other.map((path, i) => (
                <a
                  key={i}
                  href={`${import.meta.env.VITE_API_BASE_URL}/documents/uploads/${path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-status-info-bg border border-status-info/20 rounded-xl px-4 py-3 hover:border-status-info/50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-status-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-status-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content-primary">Diğer Belge {i + 1}</p>
                    <p className="text-xs text-content-tertiary truncate">{path.split('/').pop()}</p>
                  </div>
                  <svg className="w-4 h-4 text-content-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
              <div className="border-t border-border mt-4 pt-4">
                <p className="text-xs text-content-tertiary mb-3">Ek belge yüklemek için aşağıyı kullanın</p>
              </div>
            </div>
          )}

          {/* Tax Plate */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-content-secondary mb-2">
              Vergi Levhası{' '}
              <span className="text-xs text-content-tertiary">
                {application?.document?.tax_plate ? '(mevcut dosyanın üzerine yazılır)' : '(tek dosya)'}
              </span>
            </label>
            <div
              onClick={() => taxPlateRef.current?.click()}
              className={`border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-colors group ${
                application?.document?.tax_plate && !taxPlateFile
                  ? 'border-status-warning/40 bg-status-warning-bg hover:border-status-warning'
                  : 'border-border hover:border-brand-primary'
              }`}
            >
              {taxPlateFile ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-status-success-bg rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate">{taxPlateFile.name}</p>
                    <p className="text-xs text-content-tertiary">{(taxPlateFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setTaxPlateFile(null) }}
                    className="text-content-tertiary hover:text-status-error transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : application?.document?.tax_plate ? (
                <div className="flex flex-col items-center gap-1 text-status-warning group-hover:text-status-warning transition-colors py-2">
                  <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="text-sm font-medium">Vergi levhasını değiştir</p>
                  <p className="text-xs text-content-tertiary">{application.document.tax_plate.split('/').pop()}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-content-tertiary group-hover:text-brand-primary transition-colors py-2">
                  <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium">Vergi levhanızı seçin veya sürükleyin</p>
                  <p className="text-xs">PDF, JPG, PNG</p>
                </div>
              )}
            </div>
            <input
              ref={taxPlateRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) { setTaxPlateFile(e.target.files[0]); setUploadSuccess(false) } }}
            />
          </div>

          {/* Other Documents */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-content-secondary mb-2">
              Diğer Belgeler <span className="text-xs text-content-tertiary">(birden fazla eklenebilir)</span>
            </label>
            <div
              onClick={() => otherFilesRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-brand-primary rounded-xl px-4 py-4 cursor-pointer transition-colors group"
            >
              <div className="flex flex-col items-center gap-1 text-content-tertiary group-hover:text-brand-primary transition-colors py-2">
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm font-medium">Belge ekle</p>
                <p className="text-xs">PDF, JPG, PNG, DOC</p>
              </div>
            </div>
            <input
              ref={otherFilesRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={handleOtherFilesChange}
            />
            {otherFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {otherFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-surface-secondary rounded-xl px-3 py-2">
                    <div className="w-8 h-8 bg-status-info-bg rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-status-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-content-primary truncate">{f.name}</p>
                      <p className="text-xs text-content-tertiary">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => removeOtherFile(i)}
                      className="text-content-tertiary hover:text-status-error transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mb-4 bg-status-error-bg border border-status-error/30 text-status-error rounded-xl px-4 py-2.5 text-sm">
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="mb-4 bg-status-success-bg border border-status-success/30 text-status-success rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Belgeler başarıyla yüklendi.
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || (!taxPlateFile && otherFiles.length === 0)}
            className="w-full bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {uploading ? 'Yükleniyor...' : 'Belgeleri Yükle'}
          </button>
        </div>

        {/* Agreements */}
        {application && application.contracts.length > 0 && (
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-1">Sözleşmeler</h2>
            <p className="text-sm text-content-secondary mb-5">Aşağıdaki sözleşmeleri okuyup onaylayınız.</p>

            <div className="space-y-3">
              {application.contracts.map(contract => {
                const accepted = !!acceptedAgreements[contract.id]
                const meta = CONTRACT_LABELS[contract.type] ?? { label: contract.type.toUpperCase(), desc: '' }
                return (
                  <button
                    key={contract.id}
                    onClick={() => !accepted && handleAgreementClick(contract.id, meta.label, contract.link)}
                    disabled={accepted}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition-all text-left ${
                      accepted
                        ? 'border-brand-primary bg-status-success-bg cursor-default'
                        : 'border-border bg-surface-secondary hover:border-border-secondary hover:bg-white'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      accepted ? 'border-brand-primary bg-brand-primary' : 'border-border-secondary bg-white'
                    }`}>
                      {accepted && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${accepted ? 'text-brand-secondary' : 'text-content-primary'}`}>
                        {meta.label}
                      </p>
                      <p className="text-xs text-content-tertiary mt-0.5">{meta.desc}</p>
                    </div>
                    {!accepted && (
                      <div className="flex-shrink-0">
                        <svg className="w-4 h-4 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {application.contracts.every(c => acceptedAgreements[c.id]) && (
              <div className="mt-4 bg-status-success-bg border border-status-success/30 text-status-success rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tüm sözleşmeler onaylandı.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-sm text-content-tertiary">
        © {new Date().getFullYear()} Aygıt. Tüm hakları saklıdır.
      </div>

      {/* PDF Modal */}
      {pdfModal && (
        <PdfModal
          isOpen={pdfModal.open}
          title={pdfModal.title}
          pdfUrl={pdfModal.url}
          onRequestVerification={() => handleRequestVerification(pdfModal.contractId)}
          onClose={() => setPdfModal(null)}
        />
      )}

      {/* Verification Code Modal */}
      {verifyModal && (
        <VerificationCodeModal
          isOpen={true}
          phone={verifyModal.phone}
          loading={verifyLoading}
          error={verifyError}
          onVerify={handleVerifyCode}
          onResend={() => handleRequestVerification(verifyModal.contractId)}
          onClose={() => { setVerifyModal(null); setVerifyError(null) }}
        />
      )}
    </div>
  )
}

export default TrackingPage
