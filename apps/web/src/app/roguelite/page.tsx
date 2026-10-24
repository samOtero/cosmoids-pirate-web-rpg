import { notFound } from 'next/navigation';
import { isRogueliteEnabled } from '@/constants/featureFlags';
import RogueliteEntry from './RogueliteEntry';

// A direct link also lets the prototype be tried without opening a story save.
export default function RoguelitePage() {
  if (!isRogueliteEnabled()) notFound();
  return <RogueliteEntry />;
}
