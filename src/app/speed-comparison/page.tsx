import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import SpeedComparisonContent from './components/SpeedComparisonContent';

export default function SpeedComparisonPage() {
  return (
    <AppProvider>
      <AppShell>
        <SpeedComparisonContent />
      </AppShell>
    </AppProvider>
  );
}
