import Navbar from '@/app/components/Navbar';
import SavedClient from './SavedClient';

export const dynamic = 'force-dynamic';

export default function SavedPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <SavedClient />
    </div>
  );
}
