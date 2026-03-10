import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type RegistrationStatus = 'pending' | 'quoted' | 'done'

export interface ApplicationData {
  id: number
  phone: string
  message: string
  name: string | null
  surname: string | null
  tracking_number: string
  status: RegistrationStatus
  nes_info: Record<string, unknown> | null
  created_at: string
}

interface ApplicationState {
  trackingNumber: string | null
  application: ApplicationData | null
  loading: boolean
  error: string | null
}

const STORAGE_KEY = 'pre_reg_tracking_number'

const initialState: ApplicationState = {
  trackingNumber: localStorage.getItem(STORAGE_KEY),
  application: null,
  loading: false,
  error: null,
}

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setTrackingNumber(state, action: PayloadAction<string>) {
      state.trackingNumber = action.payload
      localStorage.setItem(STORAGE_KEY, action.payload)
    },
    clearTrackingNumber(state) {
      state.trackingNumber = null
      state.application = null
      localStorage.removeItem(STORAGE_KEY)
    },
    setApplication(state, action: PayloadAction<ApplicationData>) {
      state.application = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const {
  setTrackingNumber,
  clearTrackingNumber,
  setApplication,
  setLoading,
  setError,
} = applicationSlice.actions

export default applicationSlice.reducer
