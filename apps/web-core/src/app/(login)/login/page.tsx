import { BackgroundBubbles } from '@/components/landing/Bubbles';
import LoginProvider from './providers/login-provider';

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-zinc-50 overflow-hidden">
      <BackgroundBubbles />
      <LoginProvider />
    </div>
  );
}
