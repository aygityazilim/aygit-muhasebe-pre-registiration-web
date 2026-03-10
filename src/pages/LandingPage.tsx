import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../state/hooks'
import { setTrackingNumber, setApplication } from '../state/applicationSlice'
import { PreRegistrationAPI } from '../api/preRegistration'
import AygitLogo from '../components/AygitLogo'

const LandingPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', surname: '', phone: '', message: '' })
  const [trackingInput, setTrackingInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingError, setTrackingError] = useState<string | null>(null)

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.phone.trim() || !form.message.trim()) {
      setError('Telefon ve mesaj alanları zorunludur.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await PreRegistrationAPI.create({
        name: form.name || undefined,
        surname: form.surname || undefined,
        phone: form.phone,
        message: form.message,
      })
      const data = res.data.data
      dispatch(setTrackingNumber(data.tracking_number))
      dispatch(setApplication(data))
      navigate('/tracking')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      setError(axiosError?.response?.data?.error || 'Başvuru oluşturulurken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const handleTrackingLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingInput.trim()) {
      setTrackingError('Takip numarası giriniz.')
      return
    }
    setTrackingError(null)
    try {
      const res = await PreRegistrationAPI.getByTrackingNumber(trackingInput.trim())
      const data = res.data.data
      dispatch(setTrackingNumber(data.tracking_number))
      dispatch(setApplication(data))
      navigate('/tracking')
    } catch {
      setTrackingError('Bu takip numarasına ait başvuru bulunamadı.')
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Hero / Header */}
      <div className="bg-gradient-hero px-6 py-12 flex flex-col items-center">
        <AygitLogo color="#6AD140" width={200} />
        <h1 className="mt-6 text-3xl font-bold text-white text-center">
          Ön Başvuru Portalı
        </h1>
        <p className="mt-2 text-content-tertiary text-center max-w-md">
          Muhasebe hizmetlerimiz için ön başvurunuzu hızlıca oluşturun veya mevcut başvurunuzu takip edin.
        </p>
      </div>

      <div className="flex-1 px-4 py-10 flex flex-col items-center gap-8">
        {/* Application Form */}
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-content-primary mb-1">Yeni Başvuru</h2>
          <p className="text-sm text-content-secondary mb-6">Bilgilerinizi doldurun, size bir takip numarası oluşturalım.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1.5">Ad</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Adınız"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-tertiary text-content-primary placeholder-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1.5">Soyad</label>
                <input
                  name="surname"
                  value={form.surname}
                  onChange={handleFormChange}
                  placeholder="Soyadınız"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-tertiary text-content-primary placeholder-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">
                Telefon <span className="text-status-error">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder="05XX XXX XX XX"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-tertiary text-content-primary placeholder-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">
                Mesaj <span className="text-status-error">*</span>
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleFormChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                placeholder="Bize ne söylemek istersiniz?"
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-tertiary text-content-primary placeholder-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors text-sm resize-none"
                required
              />
            </div>

            {error && (
              <div className="bg-status-error-bg border border-status-error/30 text-status-error rounded-xl px-4 py-2.5 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-secondary disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mt-1"
            >
              {loading ? 'Gönderiliyor...' : 'Başvuru Oluştur'}
            </button>
          </form>
        </div>

        {/* Tracking Lookup */}
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-content-primary mb-1">Başvuru Takibi</h2>
          <p className="text-sm text-content-secondary mb-6">Mevcut başvurunuzu takip etmek için numaranızı girin.</p>

          <form onSubmit={handleTrackingLookup} className="flex gap-3">
            <input
              value={trackingInput}
              onChange={e => { setTrackingInput(e.target.value); setTrackingError(null) }}
              placeholder="Takip numaranız"
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface-tertiary text-content-primary placeholder-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors text-sm"
            />
            <button
              type="submit"
              className="bg-content-primary hover:bg-content-secondary text-white font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap text-sm"
            >
              Sorgula
            </button>
          </form>

          {trackingError && (
            <div className="mt-3 bg-status-error-bg border border-status-error/30 text-status-error rounded-xl px-4 py-2.5 text-sm">
              {trackingError}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-sm text-content-tertiary">
        © {new Date().getFullYear()} Aygıt. Tüm hakları saklıdır.
      </div>
    </div>
  )
}

export default LandingPage
