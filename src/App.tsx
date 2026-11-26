/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { ToastContainer } from './components/ToastContainer';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { MemberLayout } from './pages/member/MemberLayout';

type AppRoute = 'landing' | 'login' | 'dashboard';

const AppRouter: React.FC = () => {
  const { currentUser } = useLibrary();
  const [route, setRoute] = useState<AppRoute>('landing');

  // Automatically redirect away from protected dashboard if logged out
  useEffect(() => {
    if (!currentUser && route === 'dashboard') {
      setRoute('landing');
    }
  }, [currentUser, route]);

  const renderView = () => {
    if (route === 'login') {
      if (currentUser) {
        return currentUser.role === 'admin' ? (
          <AdminLayout onNavigateLanding={() => setRoute('landing')} />
        ) : (
          <MemberLayout onNavigateLanding={() => setRoute('landing')} />
        );
      }
      return (
        <LoginPage
          onBackHome={() => setRoute('landing')}
          onSuccess={() => setRoute('dashboard')}
        />
      );
    }

    if (route === 'dashboard' && currentUser) {
      return currentUser.role === 'admin' ? (
        <AdminLayout onNavigateLanding={() => setRoute('landing')} />
      ) : (
        <MemberLayout onNavigateLanding={() => setRoute('landing')} />
      );
    }

    return (
      <LandingPage
        onNavigateLogin={() => setRoute('login')}
        onNavigateDashboard={() => setRoute(currentUser ? 'dashboard' : 'login')}
      />
    );
  };

  return (
    <>
      {renderView()}
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <LibraryProvider>
      <AppRouter />
    </LibraryProvider>
  );
}
