'use client';

import { useRouter } from 'next/navigation';
import RogueliteScreen from '../components/roguelite/RogueliteScreen';

export default function RogueliteEntry() {
  const router = useRouter();
  return <RogueliteScreen onBack={() => router.push('/')} />;
}
