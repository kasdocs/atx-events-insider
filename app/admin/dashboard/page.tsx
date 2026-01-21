'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Managers (split files)
import EventsManager from '../components/EventsManager';
import FeaturedManager from '../components/FeaturedManager';
import StoriesManager from '../components/StoriesManager';
import SubscribersManager from '../components/SubscribersManager';
import SubmissionsManager from '../components/SubmissionsManager';
import OrganizerInquiriesManager from '../components/OrganizerInquiriesManager';
import AuthorsManager from '../components/AuthorsManager';

// Analytics panel
import MostViewedEvents from '../components/MostViewedEvents';

type AdminTab =
  | 'events'
  | 'featured'
  | 'stories'
  | 'subscribers'
  | 'submissions'
  | 'organizer_inquiries'
  | 'authors'
  | 'analytics';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('events');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check-auth', { method: 'GET' });
        if (!res.ok) {
          router.push('/admin');
          return;
        }
      } catch {
        router.push('/admin');
        return;
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">ATX Events Admin</h1>

          <div className="flex gap-4">
            <a
              href="/"
              target="_blank"
              className="px-4 py-2 text-gray-600 hover:text-purple-600"
              rel="noreferrer"
            >
              View Site
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tabbed managers */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b flex flex-wrap">
            <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')}>
              Events
            </TabButton>

            <TabButton active={activeTab === 'featured'} onClick={() => setActiveTab('featured')}>
              Featured
            </TabButton>

            <TabButton active={activeTab === 'stories'} onClick={() => setActiveTab('stories')}>
              Stories
            </TabButton>

            <TabButton active={activeTab === 'subscribers'} onClick={() => setActiveTab('subscribers')}>
              Newsletter Subscribers
            </TabButton>

            <TabButton active={activeTab === 'submissions'} onClick={() => setActiveTab('submissions')}>
              Submissions
            </TabButton>

            <TabButton
              active={activeTab === 'organizer_inquiries'}
              onClick={() => setActiveTab('organizer_inquiries')}
            >
              Organizer Inquiries
            </TabButton>

            <TabButton active={activeTab === 'authors'} onClick={() => setActiveTab('authors')}>
              Authors
            </TabButton>

            <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
              Analytics
            </TabButton>
          </div>

          <div className="p-6">
            {activeTab === 'events' && <EventsManager />}
            {activeTab === 'featured' && <FeaturedManager />}
            {activeTab === 'stories' && <StoriesManager />}
            {activeTab === 'subscribers' && <SubscribersManager />}
            {activeTab === 'submissions' && <SubmissionsManager />}
            {activeTab === 'organizer_inquiries' && <OrganizerInquiriesManager />}
            {activeTab === 'authors' && <AuthorsManager />}

            {activeTab === 'analytics' && <MostViewedEvents />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 font-semibold ${
        active ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'
      }`}
      type="button"
    >
      {children}
    </button>
  );
}
