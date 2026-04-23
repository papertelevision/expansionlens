'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = ['Dental Expansion', 'Franchise Strategy', 'Operations', 'Market Research'];

function PostEditor({ post, onBack, onRefresh }) {
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/admin/blog-posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, excerpt, content }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublish = async () => {
    setPublishing(true);
    await fetch(`/api/admin/blog-posts/${post.id}/publish`, { method: 'PUT' });
    setPublishing(false);
    onRefresh();
    onBack();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this blog post?')) return;
    await fetch(`/api/admin/blog-posts/${post.id}`, { method: 'DELETE' });
    onRefresh();
    onBack();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="admin-login-btn" style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          &larr; Back to List
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleDelete} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Delete
          </button>
          <button onClick={handlePublish} disabled={publishing} style={{ background: post.status === 'published' ? '#f59e0b' : '#10b981', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            {publishing ? '...' : post.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <span style={{ background: post.status === 'published' ? '#10b981' : '#f59e0b', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
          {post.status}
        </span>
        <span style={{ background: '#e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
          {post.category}
        </span>
        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          /blog/{post.slug}
        </a>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem' }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Excerpt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Content (HTML)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.5, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <button onClick={handleSave} disabled={saving} className="admin-login-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Preview */}
      <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Article Preview
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{post.category}</div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>{title}</h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{post.readTime}</div>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </div>
  );
}

export default function BlogPostsAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [generating, setGenerating] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);

  const fetchPosts = () => {
    fetch('/api/admin/blog-posts')
      .then((r) => r.json())
      .then((data) => { if (!data.error) setPosts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else fetchPosts();
    } catch (e) {
      setError('Generation failed. Check that ANTHROPIC_API_KEY is set.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoGenerate = async () => {
    setAutoGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/blog-posts/auto-generate', { method: 'POST' });
      const data = await res.json();
      if (data.error) setError(data.error);
      else if (data.done) setError(data.message);
      else fetchPosts();
    } catch (e) {
      setError('Auto-generation failed.');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleView = async (id) => {
    const res = await fetch(`/api/admin/blog-posts/${id}`);
    const data = await res.json();
    if (!data.error) setViewing(data);
  };

  if (loading) return <div className="admin-page-loading">Loading blog posts...</div>;

  if (viewing) {
    return (
      <div className="admin-page">
        <PostEditor
          post={viewing}
          onBack={() => { setViewing(null); fetchPosts(); }}
          onRefresh={fetchPosts}
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Blog Posts</h1>

      <div style={{ background: 'var(--card)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Generate New Blog Post</div>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={generating} className="admin-login-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
            {generating ? 'Generating (15-30s)...' : 'Generate'}
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0 0.25rem' }}>or</span>
          <button type="button" onClick={handleAutoGenerate} disabled={autoGenerating} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            {autoGenerating ? 'Generating (15-30s)...' : 'Generate Next (Auto-Rotate)'}
          </button>
        </form>
        {error && <div style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}
      </div>

      {posts.length === 0 ? (
        <div className="admin-empty">No blog posts yet. Generate one above.</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.title}</strong><br />
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/blog/{p.slug}</a>
                  </td>
                  <td><span style={{ background: '#e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{p.category}</span></td>
                  <td>
                    <span style={{ background: p.status === 'published' ? '#10b981' : '#f59e0b', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <button onClick={() => handleView(p.id)} style={{ background: 'none', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      View / Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
