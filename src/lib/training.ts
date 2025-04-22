
import { getAuthHeaders } from './utils'
import { API_BASE_URL } from './constants'
import { ManualPredictionResponse, BatchPredictionResponse } from '@/types/training'

export async function predictManual(
  experimentId: string,
  inputValues: Record<string, any>
): Promise<ManualPredictionResponse> {
  const headers = await getAuthHeaders()
  delete (headers as any)['Content-Type'];
  
  const form = new FormData()
  form.append('experiment_id', experimentId)
  form.append('input_values', JSON.stringify(inputValues))

  const res = await fetch(
    `http://localhost:8000/prediction/predict-manual/`,
    {
      method: 'POST',
      headers,
      body: form
    }
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function predictBatchCsv(
  experimentId: string,
  file: File
): Promise<BatchPredictionResponse> {
  const headers = await getAuthHeaders()
  delete (headers as any)['Content-Type'];
  
  const form = new FormData()
  form.append('experiment_id', experimentId)
  form.append('file', file)

  const res = await fetch(
    `http://localhost:8000/prediction/predict-csv/`,
    {
      method: 'POST',
      headers,
      body: form
    }
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
