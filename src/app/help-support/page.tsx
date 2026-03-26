import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import HelpSupportContent from './components/HelpSupportContent';

export default function HelpSupportPage() {
  return (
    <AppProvider>
      <AppShell>
        <HelpSupportContent />
      </AppShell>
    </AppProvider>
  );
}
