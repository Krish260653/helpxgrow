import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import MeetingDemoContent from './components/MeetingDemoContent';

export default function MeetingDemoPage() {
  return (
    <AppProvider>
      <AppShell>
        <MeetingDemoContent />
      </AppShell>
    </AppProvider>
  );
}