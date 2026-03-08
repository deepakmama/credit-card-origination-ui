import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import NewApplicationPage from './pages/NewApplicationPage'
import ApplicationListPage from './pages/ApplicationListPage'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import ThankYouPage from './pages/ThankYouPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white font-sans">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/apply" element={<NewApplicationPage />} />
            <Route path="/applications" element={<ApplicationListPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/applications/:id/confirmation" element={<ThankYouPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
