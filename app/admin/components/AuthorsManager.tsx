'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Author = {
  id: number;
  name: string | null;
  slug: string | null;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function slugify(input: string) {
  return (input || '')
    .toLowerCase()
    .trim()
    .replaceAll('&', 'and')
    .replaceAll(/[^a-z0-9\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

export default function AuthorsManager() {
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [editing, setEditing] = useState<Author | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    role: '',
    bio: '',
    avatar_url: '',
    instagram_url: '',
    website_url: '',
    is_active: true,
  });

  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      role: '',
      bio: '',
      avatar_url: '',
      instagram_url: '',
      website_url: '',
      is_active: true,
    });
    setEditing(null);
  };

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const rows = Array.isArray(data) ? (data as Author[]) : [];
      setAuthors(rows);
    } catch (e) {
      console.error('Error fetching authors:', e);
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAndSorted = useMemo(() => {
    const filtered = authors.filter((a) => {
      if (!activeOnly) return true;
      return Boolean(a.is_active);
    });

    return filtered.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      if (aName < bName) return sortDirection === 'asc' ? -1 : 1;
      if (aName > bName) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [authors, activeOnly, sortDirection]);

  const startEdit = (a: Author) => {
    setEditing(a);
    setForm({
      name: a.name ?? '',
      slug: a.slug ?? '',
      role: a.role ?? '',
      bio: a.bio ?? '',
      avatar_url: a.avatar_url ?? '',
      instagram_url: a.instagram_url ?? '',
      website_url: a.website_url ?? '',
      is_active: a.is_active ?? true,
    });
  };

  const onChange = (key: keyof typeof form, value: string | boolean) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const autoSlugFromName = () => {
    const nextSlug = slugify(form.name);
    onChange('slug', nextSlug);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.slug.trim()) return 'Slug is required.';
    return null;
  };

  const saveAuthor = async () => {
    const validation = validate();
    if (validation) {
      alert(validation);
      return;
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from('authors')
          .update({
            name: form.name.trim(),
            slug: form.slug.trim(),
            role: form.role.trim() || null,
            bio: form.bio.trim() || null,
            avatar_url: form.avatar_url.trim() || null,
            instagram_url: form.instagram_url.trim() || null,
            website_url: form.website_url.trim() || null,
            is_active: form.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editing.id);

        if (error) throw error;

        await fetchAuthors();
        resetForm();
        alert('Author updated.');
        return;
      }

      const { error } = await supabase.from('authors').insert([
        {
          name: form.name.trim(),
          slug: form.slug.trim(),
          role: form.role.trim() || null,
          bio: form.bio.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
          website_url: form.website_url.trim() || null,
          is_active: form.is_active,
        },
      ]);

      if (error) throw error;

      await fetchAuthors();
      resetForm();
      alert('Author created.');
    } catch (e: any) {
      console.error('Save author error:', e);
      const msg =
        typeof e?.message === 'string'
          ? e.message
          : 'Failed to save author. Check console for details.';
      alert(msg);
    }
  };

  const toggleActive = async (a: Author) => {
    try {
      const nextActive = !Boolean(a.is_active);
      const { error } = await supabase
        .from('authors')
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', a.id);

      if (error) throw error;
      await fetchAuthors();
    } catch (e) {
      console.error('Toggle active error:', e);
      alert('Failed to update status.');
    }
  };

  const deleteAuthor = async (a: Author) => {
    if (!confirm(`Delete author "${a.name ?? a.slug ?? a.id}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('authors').delete().eq('id', a.id);
      if (error) throw error;
      await fetchAuthors();
      if (editing?.id === a.id) resetForm();
    } catch (e) {
      console.error('Delete author error:', e);
      alert('Failed to delete author.');
    }
  };

  if (loading) return <div className="text-gray-600">Loading authors...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Authors</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage author bios used for story/event attribution
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchAuthors}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Refresh
          </button>
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            New Author
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h3 className="font-bold text-gray-800">
            {editing ? 'Edit Author' : 'Create Author'}
          </h3>

          {editing && (
            <button onClick={resetForm} className="text-sm text-gray-600 hover:text-gray-900">
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
            <input
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Kas Santos"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Slug *</label>
              <button
                type="button"
                onClick={autoSlugFromName}
                className="text-xs text-purple-700 hover:underline"
                title="Generate slug from name"
              >
                Auto
              </button>
            </div>
            <input
              value={form.slug}
              onChange={(e) => onChange('slug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="kas"
            />
            <p className="text-xs text-gray-500 mt-1">Used in URLs like /authors/kas</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role / Title</label>
            <input
              value={form.role}
              onChange={(e) => onChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Editor"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => onChange('bio', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Short bio shown on author pages."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar URL</label>
            <input
              value={form.avatar_url}
              onChange={(e) => onChange('avatar_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram URL</label>
            <input
              value={form.instagram_url}
              onChange={(e) => onChange('instagram_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
            <input
              value={form.website_url}
              onChange={(e) => onChange('website_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 mt-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange('is_active', e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 font-semibold">
              Active (visible for linking)
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6 flex-wrap">
          <button
            onClick={saveAuthor}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            {editing ? 'Save Changes' : 'Create Author'}
          </button>

          {editing && (
            <button
              onClick={() => resetForm()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveOnly((v) => !v)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeOnly ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {activeOnly ? 'Active only' : 'All authors'}
          </button>

          <button
            onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="px-4 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Sort: {sortDirection === 'asc' ? 'A → Z' : 'Z → A'}
          </button>
        </div>

        <div className="text-sm text-gray-600">Showing: {filteredAndSorted.length}</div>
      </div>

      <div className="overflow-x-auto bg-white border rounded-xl">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredAndSorted.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {a.avatar_url ? (
                      <img
                        src={a.avatar_url}
                        alt={a.name ?? a.slug ?? 'Author'}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                      {a.instagram_url ? (
                        <div className="text-xs text-gray-600">{a.instagram_url}</div>
                      ) : (
                        <div className="text-xs text-gray-500">No Instagram</div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-gray-800">{a.slug}</td>

                <td className="px-4 py-3 text-sm text-gray-800">{a.role || '—'}</td>

                <td className="px-4 py-3 text-sm">
                  {a.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      Inactive
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => startEdit(a)}
                      className="text-purple-600 hover:text-purple-800 font-semibold"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleActive(a)}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {a.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => deleteAuthor(a)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSorted.length === 0 && (
          <div className="text-center py-10 text-gray-500">No authors found.</div>
        )}
      </div>
    </div>
  );
}
