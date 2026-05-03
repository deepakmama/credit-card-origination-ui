import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import NewApplicationPage from './pages/NewApplicationPage'
import ApplicationListPage from './pages/ApplicationListPage'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import ThankYouPage from './pages/ThankYouPage'
import DashboardPage from './pages/DashboardPage'
import PrequalifyPage from './pages/PrequalifyPage'
import ReviewQueuePage from './pages/ReviewQueuePage'
import OffersPage from './pages/OffersPage'
import AbTestPage from './pages/AbTestPage'
import ConfigurationsPage from './pages/ConfigurationsPage'
import ChatApplyPage from './pages/ChatApplyPage'
import AgentsPage from './pages/AgentsPage'

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
            <Route path="/prequalify" element={<PrequalifyPage />} />
            <Route path="/review-queue" element={<ReviewQueuePage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/ab-test" element={<AbTestPage />} />
            <Route path="/configurations" element={<ConfigurationsPage />} />
            <Route path="/ai-apply" element={<ChatApplyPage />} />
            <Route path="/agents" element={<AgentsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
