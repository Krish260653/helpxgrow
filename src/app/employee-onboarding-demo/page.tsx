import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';
import OnboardingDemoContent from './components/OnboardingDemoContent';

export default function OnboardingDemoPage() {
  return (
    <AppProvider>
      <AppShell>
        <OnboardingDemoContent />
      </AppShell>
    </AppProvider>
  );
}