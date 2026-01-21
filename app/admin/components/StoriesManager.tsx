'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Author, Story } from '../lib/adminTypes';
import { slugify } from '../lib/adminUtils';

const STORY_TYPES = [
  'Event Recap',
  'Venue Spotlight',
  'Interview',
  'Neighborhood Guide',
  'Tips & Guides',
  'Seasonal Roundup',
  'Hidden Gems',
  'Food & Drink Focus',
  'Community Stories',
  'Event Preview',
  'Top Lists',
  'News & Announcements',
] as const;

type SortField = 'published_date';

export default function StoriesManager() {
  const [stories, setStories] = useState<Story[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);

  const [sortField, setSortField] = useState<SortField>('published_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [storiesRes, authorsRes] = await Promise.all([fetch('/api/stories'), fetch('/api/authors')]);

      const storiesJson = await storiesRes.json().catch(() => []);
      const authorsJson = await authorsRes.json().catch(() => []);

      setStories(Array.isArray(storiesJson) ? storiesJson : []);
      setAuthors(Array.isArray(authorsJson) ? authorsJson : []);
    } catch (e) {
      console.error('Load stories/authors error:', e);
      setStories([]);
      setAuthors([]);
    }
    setLoading(false);
  };

  const authorsById = useMemo(() => {
    const map = new Map<string, Author>();
    for (const a of authors) map.set(a.id, a);
    return map;
  }, [authors]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedStories = useMemo(() => {
    const out = [...stories].sort((a, b) => {
      const aDate = new Date(a.published_date).getTime();
      const bDate = new Date(b.published_date).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    });
    return out;
  }, [stories, sortField, sortDirection]);

  const openCreate = () => {
    setEditingStory(null);
    setShowForm(true);
  };

  const openEdit = (s: Story) => {
    setEditingStory(s);
    setShowForm(true);
  };

  const closeForm = async () => {
    setShowForm(false);
    setEditingStory(null);
    await loadAll();
  };

  const deleteStory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const res = await fetch(`/api/admin/stories/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to delete story.');
        return;
      }
      await loadAll();
    } catch (e) {
      console.error('Delete story error:', e);
      alert('Failed to delete story.');
    }
  };

  if (loading) return <div className="text-gray-600">Loading stories...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Manage Stories</h2>
        <div className="flex gap-2">
          <button
            onClick={loadAll}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Refresh
          </button>
          <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            + Add New Story
          </button>
        </div>
      </div>

      {showForm && (
        <StoryForm story={editingStory} authors={authors} onClose={closeForm} />
      )}

      {!showForm && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Author</th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('published_date')}
                >
                  <div className="flex items-center gap-2">
                    Published Date
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Featured</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {sortedStories.map((story) => {
                const authorName =
                  (story.author_id && authorsById.get(story.author_id)?.name) || story.author || '—';

                return (
                  <tr key={story.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{story.title}</td>
                    <td className="px-4 py-3 text-sm">{authorName}</td>
                    <td className="px-4 py-3 text-sm">{new Date(story.published_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">
                      {story.featured ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">⭐ Featured</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Standard</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => openEdit(story)} className="text-blue-600 hover:text-blue-800 mr-3">
                        Edit
                      </button>
                      <button onClick={() => deleteStory(story.id)} className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {stories.length === 0 && (
            <div className="text-center py-8 text-gray-500">No stories yet. Click "Add New Story" to create one.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------- Story Form --------------------------- */

function StoryForm({
  story,
  authors,
  onClose,
}: {
  story: Story | null;
  authors: Author[];
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: story?.title || '',
    slug: story?.slug || '',
    excerpt: story?.excerpt || '',
    content: story?.content || '',
    author_id: story?.author_id || null,
    cover_image: story?.cover_image || '',
    published_date: story?.published_date || new Date().toISOString().slice(0, 10),
    featured: story?.featured || false,
    story_type: story?.story_type || '',
    event_id: story?.event_id || null,
  });

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug ? prev.slug : slugify(title),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim() || null,
        content: formData.content,
        author_id: formData.author_id || null,
        cover_image: formData.cover_image.trim() || null,
        published_date: formData.published_date,
        featured: Boolean(formData.featured),
        story_type: formData.story_type || null,
        event_id: formData.event_id ? Number(formData.event_id) : null,
      };

      if (!payload.title) {
        alert('Title is required.');
        setSaving(false);
        return;
      }
      if (!payload.slug) {
        alert('Slug is required.');
        setSaving(false);
        return;
      }
      if (!payload.content) {
        alert('Content is required.');
        setSaving(false);
        return;
      }
      if (!payload.published_date) {
        alert('Published date is required.');
        setSaving(false);
        return;
      }

      const url = story ? `/api/admin/stories/${story.id}` : '/api/admin/stories';
      const method = story ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to save story.');
        setSaving(false);
        return;
      }

      await onClose();
    } catch (err) {
      console.error('Save story error:', err);
      alert('Failed to save story.');
    }

    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="mb-6 p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{story ? 'Edit Story' : 'Add New Story'}</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2">
          <label className="block text-sm font-semibold mb-2 text-gray-700">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Slug *</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Author *</label>
          <select
            required
            value={formData.author_id ?? ''}
            onChange={(e) => setFormData((p) => ({ ...p, author_id: e.target.value ? e.target.value : null }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select an author</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">Published Date *</label>
          <input
            type="date"
            required
            value={formData.published_date}
            onChange={(e) => setFormData((p) => ({ ...p, published_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="featuredStory"
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => setFormData((p) => ({ ...p, featured: e.target.checked }))}
          />
          <label htmlFor="featuredStory" className="text-sm font-semibold text-gray-700">
            Featured Story
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Excerpt</label>
        <textarea
          value={formData.excerpt}
          onChange={(e) => setFormData((p) => ({ ...p, excerpt: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Story Type</label>
        <select
          value={formData.story_type || ''}
          onChange={(e) => setFormData((p) => ({ ...p, story_type: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">Select Story Type</option>
          {STORY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Content *</label>
        <textarea
          required
          value={formData.content}
          onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Cover Image URL</label>
        <input
          type="url"
          value={formData.cover_image}
          onChange={(e) => setFormData((p) => ({ ...p, cover_image: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : story ? 'Update Story' : 'Create Story'}
        </button>
        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </form>
  );
}
