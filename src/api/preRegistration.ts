import client from './client'
import type { ApplicationData } from '../state/applicationSlice'

export interface CreateApplicationPayload {
  name?: string
  surname?: string
  phone: string
  message: string
}

interface ApiResponse<T> {
  status: number
  success: boolean
  error: string | null
  data: T
}

export const PreRegistrationAPI = {
  create: (payload: CreateApplicationPayload) =>
    client.post<ApiResponse<ApplicationData>>('/', payload),

  getByTrackingNumber: (trackingNumber: string) =>
    client.get<ApiResponse<ApplicationData>>(`/${trackingNumber}`),

  uploadDocuments: (trackingNumber: string, formData: FormData) =>
    client.post<ApiResponse<{ tax_plate: string | null; other: string[] }>>(
      `/${trackingNumber}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  sendVerificationCode: (trackingNumber: string, contractId: number) =>
    client.patch<ApiResponse<null>>(`/contract-verification/${trackingNumber}/send-code?contract=${contractId}`),

  verifyContractCode: (trackingNumber: string, contractId: number, code: string) =>
    client.patch<ApiResponse<null>>(`/contract-verification/${trackingNumber}/verify-code?contract=${contractId}&code=${code}`),
}
