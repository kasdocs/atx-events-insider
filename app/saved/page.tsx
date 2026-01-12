import Navbar from '@/app/components/Navbar';
import SavedClient from './SavedClient'

export const dynamic = 'force-dynamic';

export default function SavedPage() {
  return (
    <div>
      <Navbar />
      <SavedClient />
    </div>
  );
}
