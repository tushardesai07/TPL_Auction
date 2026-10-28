import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuctionProvider, useAuction } from './context/AuctionContext';
import { AuctionHeader } from './components/common/AuctionHeader';
import { SoldOverlay } from './components/common/SoldOverlay';
import { UnsoldOverlay } from './components/common/UnsoldOverlay';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AuctioneerPage } from './pages/AuctioneerPage';
import { ManagerPage } from './pages/ManagerPage';
import { LiveSpectatorPage } from './pages/LiveSpectatorPage';
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { PlayerManagementPage } from './pages/PlayerManagementPage';
import { AuctionSettingsPage } from './pages/AuctionSettingsPage';
import { AuctionResultsPage } from './pages/AuctionResultsPage';

const AppLayout: React.FC = () => {
  const { soldOverlay, closeSoldOverlay, unsoldOverlay, closeUnsoldOverlay } = useAuction();

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-primary selection:bg-gold selection:text-bg-main font-sans">
      <AuctionHeader />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/auction" element={<AuctioneerPage />} />
          <Route path="/admin/teams" element={<TeamManagementPage />} />
          <Route path="/admin/players" element={<PlayerManagementPage />} />
          <Route path="/admin/settings" element={<AuctionSettingsPage />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/live" element={<LiveSpectatorPage />} />
          <Route path="/results" element={<AuctionResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Cinematic Sold & Unsold Overlays */}
      <SoldOverlay data={soldOverlay} onClose={closeSoldOverlay} />
      <UnsoldOverlay data={unsoldOverlay} onClose={closeUnsoldOverlay} />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuctionProvider>
          <AppLayout />
        </AuctionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
