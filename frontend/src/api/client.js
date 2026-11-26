import axios from "axios"

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

// One axios instance for the whole app
const api = axios.create({ baseURL: `${API_URL}/api` })

// Attach the JWT to every request when the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("novashop_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Turn any error into a readable message
export function errorMessage(err) {
  return err?.response?.data?.message || err?.message || "Something went wrong"
}

// Image paths from the API are relative (/uploads/...), so prefix the server URL
export function imageUrl(path) {
  if (!path) return null
  return path.startsWith("http") ? path : `${API_URL}${path}`
}

export default api
