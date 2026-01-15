import { Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './components/Home'
import Reader from './components/Reader/Reader'
import { IndexModal } from './components/Index/IndexModal'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/descartes/meditations" element={<Reader />} />
        </Routes>
        <IndexModal />
      </div>
    </ErrorBoundary>
  )
}

export default App
