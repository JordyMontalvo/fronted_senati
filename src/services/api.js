import axios from 'axios'

const api = axios.create({
  // Asegurar que la URL termine en /api
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '') + (import.meta.env.VITE_API_URL?.endsWith('/api') ? '' : '/api'),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api
