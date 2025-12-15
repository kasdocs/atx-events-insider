'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import NewsletterSignup from './NewsletterSignup';

export default function Sidebar() {
  const [recentStories, setRecentStories] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentStories();
  }, []);

  const fetchRecentStories = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('published_date', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error fetching stories:', error);
    } else {
      setRecentStories(data || []);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-8">
      {/* Recent Stories */}
      <div>
        <h3 className="text-xl font-bold mb-4" style={{color: '#7B2CBF'}}>
          📖 Recent Stories
        </h3>
        
        {recentStories.length > 0 ? (
          <div className="space-y-4">
            {recentStories.map((story) => (
              <a 
                key={story.id}
                href={`/stories/${story.slug}`}
                className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <img 
                  src={story.cover_image} 
                  alt={story.title}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <div className="flex gap-2 mb-1 flex-wrap">
                    {story.featured && (
                      <span className="inline-block px-2 py-0.5 bg-pink-500 text-white text-xs font-semibold rounded">
                        ⭐ Featured
                      </span>
                    )}
                    {story.story_type && (
                      <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        {story.story_type}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                    {story.title}
                  </h4>
                  <p className="text-xs text-gray-500">{formatDate(story.published_date)}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No stories yet</p>
        )}
        
        <a 
          href="/stories" 
          className="block mt-4 text-sm font-semibold text-center py-2 rounded-lg border-2 hover:bg-purple-600 hover:text-white transition-colors"
          style={{
            borderColor: '#7B2CBF',
            color: '#7B2CBF'
          }}
        >
          View All Stories →
        </a>
      </div>

      {/* Quick Date Jump */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-bold mb-4" style={{color: '#7B2CBF'}}>
          📅 Quick Jump
        </h3>
        <div className="space-y-3">
          <a 
            href={`/browse?date=${new Date().toISOString().split('T')[0]}`}
            className="block w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
          >
            <div className="font-semibold text-sm">Today</div>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </a>
          <a 
            href={`/browse?date=${new Date(Date.now() + 86400000).toISOString().split('T')[0]}`}
            className="block w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
          >
            <div className="font-semibold text-sm">Tomorrow</div>
            <div className="text-xs text-gray-500">
              {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </a>
          <a 
            href={`/browse?weekend=true`}
            className="block w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
          >
            <div className="font-semibold text-sm">This Weekend</div>
            <div className="text-xs text-gray-500">Sat-Sun</div>
          </a>
          <a 
            href={`/browse?nextweek=true`}
            className="block w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
          >
            <div className="font-semibold text-sm">Next Week</div>
            <div className="text-xs text-gray-500">Next 7 Days</div>
          </a>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-semibold mb-2" style={{color: '#7B2CBF'}}>
            Or pick a date:
          </label>
          <input 
            type="date" 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => {
              if (e.target.value) {
                window.location.href = `/browse?date=${e.target.value}`;
              }
            }}
          />
        </div>
      </div>

      {/* Newsletter Signup */}
      <NewsletterSignup source="homepage-sidebar" />
      
      {/* Submit Event CTA */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <h3 className="font-bold text-lg mb-2" style={{color: '#7B2CBF'}}>
          🎉 Have an Event?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Share your Austin event with our community!
        </p>
        
         <a href="/submit-event"
          className="block w-full px-4 py-3 text-center text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          style={{backgroundColor: '#FF006E'}}
        >
          Submit Your Event →
        </a>
      </div>
      
    </div>
  );
}