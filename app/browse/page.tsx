import { Suspense } from 'react';
import BrowseContent from './BrowseContent';

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading events...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
