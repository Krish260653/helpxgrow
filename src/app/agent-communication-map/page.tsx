import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import AgentMapContent from './components/AgentMapContent';

export default function AgentCommunicationMapPage() {
  return (
    <AppProvider>
      <AppShell>
        <AgentMapContent />
      </AppShell>
    </AppProvider>
  );
}
