import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import ArchitectureContent from './components/ArchitectureContent';

export default function ArchitecturePage() {
  return (
    <AppProvider>
      <AppShell>
        <ArchitectureContent />
      </AppShell>
    </AppProvider>
  );
}
