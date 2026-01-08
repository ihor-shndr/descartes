import { Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Reader from './components/Reader/Reader'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<Navigate to="/read?page=1" replace />} />
          <Route path="/read" element={<Reader />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App
