import { API_BASE_URL } from '../config/api';

const NETWORK_ERROR_MESSAGE = 'Could not connect to Kundli service. Please try again.';
const GENERATION_ERROR_MESSAGE =
  'Unable to generate your Kundli right now. Please check your details and try again.';

export async function generateKundli(request) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/kundli/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  let apiResponse;

  try {
    apiResponse = await response.json();
  } catch {
    throw new Error(GENERATION_ERROR_MESSAGE);
  }

  if (response.ok && apiResponse?.success === true && apiResponse.data) {
    return apiResponse.data;
  }

  throw new Error(apiResponse?.message || GENERATION_ERROR_MESSAGE);
}
