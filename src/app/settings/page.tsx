import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import SettingsContent from './components/SettingsContent';

export default function SettingsPage() {
  return (
    <AppProvider>
      <AppShell>
        <SettingsContent />
      </AppShell>
    </AppProvider>
  );
}
