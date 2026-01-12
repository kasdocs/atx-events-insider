import Navbar from '@/app/components/Navbar';
import StoriesClient from './StoriesClient'

export const dynamic = 'force-dynamic';

export default function StoriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <StoriesClient />
    </div>
  );
}
