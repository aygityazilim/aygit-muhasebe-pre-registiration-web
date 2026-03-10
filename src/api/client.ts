import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/pre-registiration',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default client
