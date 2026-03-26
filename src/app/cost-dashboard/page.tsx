import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import CostDashboardContent from './components/CostDashboardContent';

export default function CostDashboardPage() {
  return (
    <AppProvider>
      <AppShell>
        <CostDashboardContent />
      </AppShell>
    </AppProvider>
  );
}