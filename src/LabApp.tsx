import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LabScreen from './screens/LabScreen'

function PublicFallback() {
  const location = useLocation()
  return <Navigate to={{ pathname: '/Lab', search: location.search }} replace />
}

// Public visitors do not need the image app's auth, stores or launch-status request.
export default function LabApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Lab" element={<LabScreen />} />
        <Route path="*" element={<PublicFallback />} />
      </Routes>
    </BrowserRouter>
  )
}
