import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken || original.url?.includes('/auth/login') || original.url?.includes('/auth/refresh')) {
        return Promise.reject(error)
      }
      original._retry = true
      try {
        if (!refreshing) {
          refreshing = axios
            .post('/api/auth/refresh', { refreshToken })
            .then((r) => {
              const accessToken = r.data?.data?.accessToken
              if (accessToken) localStorage.setItem('accessToken', accessToken)
              return accessToken
            })
            .finally(() => {
              refreshing = null
            })
        }
        const accessToken = await refreshing
        if (!accessToken) throw error
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (e) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  }
)

export const getErrorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback

export default api
