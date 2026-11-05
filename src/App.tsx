import { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { NavPage } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PredictRoiPage } from './pages/PredictRoiPage';
import { CompareScenariosPage } from './pages/CompareScenariosPage';
import { resolveRoute } from './services/navigation';
import { ScenarioTransferProvider } from './contexts/ScenarioTransferContext';
import { ModelProvider } from './contexts/ModelContext';

export function App() {
  const [route, setRoute] = useState(() => ({ ...resolveRoute(window.location.hash, window.location.pathname), navigationId: 0 }));
  const currentPage = route.page;
  const handlePageChange = (page: NavPage) => {
    setRoute(previous => ({ page, modelInfo: false, legacyInsights: false, navigationId: previous.navigationId + 1 }));
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(() => {
    const syncRoute = () => {
      const resolved = resolveRoute(window.location.hash, window.location.pathname);
      if (resolved.legacyInsights) {
        const canonical = new URL(window.location.href);
        if (/^\/insights\/?$/.test(canonical.pathname)) canonical.pathname = '/';
        canonical.hash = 'predict/model-info';
        window.history.replaceState(window.history.state, '', canonical);
      }
      setRoute(previous => ({ ...resolved, navigationId: previous.navigationId + 1 }));
    };
    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'predict':
        return <PredictRoiPage modelInfoRequest={route.modelInfo ? route.navigationId : undefined} />;
      case 'scenarios':
        return <CompareScenariosPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ModelProvider><ScenarioTransferProvider><Layout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderCurrentPage()}
    </Layout></ScenarioTransferProvider></ModelProvider>
  );
}

export default App;
