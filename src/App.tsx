import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './state/store'
import { useAppSelector } from './state/hooks'
import LandingPage from './pages/LandingPage'
import TrackingPage from './pages/TrackingPage'

function AppRoutes() {
  const { trackingNumber } = useAppSelector(s => s.application)

  return (
    <Routes>
      <Route
        path="/"
        element={trackingNumber ? <Navigate to="/tracking" replace /> : <LandingPage />}
      />
      <Route
        path="/tracking"
        element={trackingNumber ? <TrackingPage /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  )
}

export default App
