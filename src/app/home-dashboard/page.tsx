import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import HomeDashboardContent from './components/HomeDashboardContent';

export default function HomeDashboardPage() {
  return (
    <AppProvider>
      <AppShell>
        <HomeDashboardContent />
      </AppShell>
    </AppProvider>
  );
}