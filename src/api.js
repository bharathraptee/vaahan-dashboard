let portParam = null;
if (window.electronAPI) {
  try {
    portParam = window.electronAPI.getBackendPortSync();
  } catch (e) {
    console.error("Failed to get port from IPC", e);
  }
}
if (!portParam) {
  const urlParams = new URLSearchParams(window.location.search);
  portParam = urlParams.get('port');
}

const API_BASE_URL = portParam ? `http://localhost:${portParam}/api` : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api')

/**
 * Generic fetch wrapper to handle errors and show native browser alerts.
 */
const safeFetch = async (url, options = {}, contextMessage) => {
  try {
    const res = await fetch(url, options)
    
    if (!res.ok) {
      let errorDetail = "Unknown Error"
      try {
        const errData = await res.json()
        errorDetail = errData.detail || errData.message || JSON.stringify(errData)
      } catch (e) {
        errorDetail = res.statusText || "No additional details"
      }
      
      const fullMessage = `⚠️ API Error: ${contextMessage}\n\nStatus Code: HTTP ${res.status}\nReason: ${errorDetail}\n\nIf you see Vahan API errors, Vahan might be rate-limiting you or their portal is temporarily down.`
      window.alert(fullMessage)
      throw new Error(fullMessage)
    }
    
    return await res.json()
  } catch (error) {
    // Check if it's a "Failed to fetch" network crash (meaning Python backend is completely dead)
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
       const msg = `🔌 Connection Refused!\n\nUnable to reach the Python backend at ${API_BASE_URL}.\nPlease check your terminal and ensure 'uvicorn main:app --reload' is running.`
       window.alert(msg)
       throw new Error(msg)
    }
    
    // If the error was already handled and alerted above, just re-throw it so the UI handles loading states
    if (error.message.includes('⚠️')) {
      throw error
    }
    
    // Any other unexpected error
    const fallbackMsg = `❌ Unexpected Error: ${contextMessage}\n\nDetails: ${error.message}`
    window.alert(fallbackMsg)
    throw error
  }
}

/**
 * Fetches the list of vehicle makers / companies.
 */
export const fetchCompanies = async () => {
  return await safeFetch(`${API_BASE_URL}/companies`, {}, "Failed to fetch companies list.")
}

/**
 * Fetches the list of RTOs for a given state code.
 */
export const fetchRtos = async (stateCode) => {
  return await safeFetch(`${API_BASE_URL}/rtos/${stateCode}`, {}, `Failed to fetch RTOs for state: ${stateCode}.`)
}

/**
 * Fetches compare data for selected companies across all endpoints.
 */
export const fetchCompareData = async (payload) => {
  return await safeFetch(`${API_BASE_URL}/data/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, "Failed to fetch compare data.")
}

/**
 * Fetches deep month-wise breakdown for each RTO in the selected city.
 */
export const fetchCityRtoBreakdown = async (payload, rtos) => {
  return await safeFetch(`${API_BASE_URL}/data/city-rto-breakdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, rtos })
  }, "Failed to fetch City RTO breakdown.")
}

/**
 * Fetches Top 5 RTOs for a single company in a specific state.
 */
export const fetchCompanyTop5Rtos = async (company, stateCode, basePayload) => {
  const payload = {
    ...basePayload,
    companies: [company],
    stateCode: stateCode,
    rtoCode: 0
  }
  
  const data = await safeFetch(`${API_BASE_URL}/data/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, `Failed to fetch Top 5 RTOs for ${company}.`)
  
  return data[company]?.[ "Top 5 (State/RTO)" ]
}
