import { useState } from 'react';
import { AppProvider, useApp } from '@/store/AppContext';
import { Layout, type PageId } from '@/components/Layout';
import { OverviewPage } from '@/pages/OverviewPage';
import { ClimatePage } from '@/pages/ClimatePage';
import { ShelterPage } from '@/pages/ShelterPage';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { SimulationPage } from '@/pages/SimulationPage';
import { ComparePage } from '@/pages/ComparePage';
import { OptimizationPage } from '@/pages/OptimizationPage';
import { RecommendationPage } from '@/pages/RecommendationPage';
import { SustainabilityPage } from '@/pages/SustainabilityPage';
import { ReportPage } from '@/pages/ReportPage';

function AppContent() {
  const [page, setPage] = useState<PageId>('overview');
  const { loadDemo, runLadakhCaseStudy } = useApp();

  const handleNavigate = (p: PageId) => setPage(p);

  return (
    <Layout
      current={page}
      onNavigate={handleNavigate}
      onLoadDemo={loadDemo}
      onRunLadakh={runLadakhCaseStudy}
    >
      {page === 'overview' && <OverviewPage onNavigate={handleNavigate} />}
      {page === 'climate' && <ClimatePage />}
      {page === 'shelter' && <ShelterPage />}
      {page === 'materials' && <MaterialsPage />}
      {page === 'simulation' && <SimulationPage />}
      {page === 'compare' && <ComparePage />}
      {page === 'optimization' && <OptimizationPage />}
      {page === 'recommendation' && <RecommendationPage onNavigate={handleNavigate} />}
      {page === 'sustainability' && <SustainabilityPage />}
      {page === 'report' && <ReportPage />}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
