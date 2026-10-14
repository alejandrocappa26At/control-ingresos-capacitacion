import type { Metadata } from 'next';
import { LoginScreen } from '@/components/auth/LoginScreen';

export const metadata: Metadata = {
  title: 'Iniciar sesión · AT People',
};

export default function LoginPage() {
  return <LoginScreen />;
}