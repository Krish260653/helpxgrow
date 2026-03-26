import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import AuditTrailContent from './components/AuditTrailContent';

export default function AuditTrailPage() {
  return (
    <AppProvider>
      <AppShell>
        <AuditTrailContent />
      </AppShell>
    </AppProvider>
  );
}
