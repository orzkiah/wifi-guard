import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './views/DashboardView';
import { DevicesView } from './views/DevicesView';
import { BlockedView } from './views/BlockedView';
import { TrustedView } from './views/TrustedView';
import { HistoryView } from './views/HistoryView';
import { RouterView } from './views/RouterView';
import { SettingsView } from './views/SettingsView';
import { TutorialView } from './views/TutorialView';
import { SpeedTestView } from './views/SpeedTestView';
import { DeviceDetailDrawer } from './components/DeviceDetailDrawer';
import { BlockConfirmModal } from './components/BlockConfirmModal';
import { LoginModal } from './components/LoginModal';
import { TutorialModal } from './components/TutorialModal';
import { useAppStore } from './stores/useAppStore';

export const App: React.FC = () => {
  const { currentView, init } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Sidebar Navigation (Desktop Static / Mobile Drawer) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-hidden bg-slate-950 min-h-0">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'devices' && <DevicesView />}
          {currentView === 'speedtest' && <SpeedTestView />}
          {currentView === 'blocked' && <BlockedView />}
          {currentView === 'trusted' && <TrustedView />}
          {currentView === 'history' && <HistoryView />}
          {currentView === 'router' && <RouterView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'tutorial' && <TutorialView />}
        </main>

        {/* 4-Item Core Mobile Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Overlays & Drawers */}
      <DeviceDetailDrawer />
      <BlockConfirmModal />
      <LoginModal />
      <TutorialModal />
    </div>
  );
};
