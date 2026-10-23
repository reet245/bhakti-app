import { requestJson } from './http';

const GENERATION_ERROR_MESSAGE =
  'Unable to generate your Kundli right now. Please check your details and try again.';

export async function generateKundli(request, { signal } = {}) {
  const apiResponse = await requestJson('/api/v1/kundli/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
      timeoutMs: 60000,
    });

  if (apiResponse?.success === true && apiResponse.data) {
    return apiResponse.data;
  }

  if (apiResponse?.success === true && apiResponse.calculationMeta) {
    return apiResponse;
  }

  throw new Error(apiResponse?.message || GENERATION_ERROR_MESSAGE);
}
