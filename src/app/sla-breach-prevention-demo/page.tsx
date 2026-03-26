import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import SLADemoContent from './components/SLADemoContent';

export default function SLADemoPage() {
  return (
    <AppProvider>
      <AppShell>
        <SLADemoContent />
      </AppShell>
    </AppProvider>
  );
}