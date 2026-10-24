import type { Metadata } from 'next';
import ResetPasswordScreen from '@/app/components/auth/ResetPasswordScreen';

export const metadata: Metadata = {
  title: 'Reset password · Cosmoids',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ResetPasswordPage() {
  return <ResetPasswordScreen />;
}
