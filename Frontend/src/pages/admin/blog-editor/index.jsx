import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ExternalLink, Eye, ImagePlus, Loader2, Save, Search, Send, Star, Tag, Trash2, Undo2, X,
} from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import PageHero from '../../../components/PageHero';
import Panel from '../../../components/admin/Panel';
import RichTextEditor from '../../../components/admin/RichTextEditor';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { PageError, PageLoader } from '../../../components/admin/QueryState';
import { Field, SelectInput, TextArea, TextInput } from '../../../components/FormFields';
import { BLOG_CATEGORY_OPTIONS, BLOG_STATUS_STYLES, MAX_BLOG_EXCERPT, MAX_BLOG_TAGS } from '../../../data/adminOptions';
import { labelize } from '../../../data/propertyOptions';
import { formatDateTime, formatNumber } from '../../../utils/format';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

const toForm = (blog = {}) => ({
  title: blog.title || '',
  slug: blog.slug || '',
  excerpt: blog.excerpt || '',
  content: blog.content || '',
  coverImageUrl: blog.coverImageUrl || '',
  category: blog.category || '',
  tags: blog.tags || [],
  isFeatured: Boolean(blog.isFeatured),
  seo: { metaTitle: blog.seo?.metaTitle || '', metaDescription: blog.seo?.metaDescription || '' },
});

const counter = (value, max) => (
  <span className={value.length > max ? 'text-red-600' : 'text-gray-400'}>{value.length}/{max}</span>
);

function TagInput({ tags, onChange }) {
  const [text, setText] = useState('');
  const add = () => {
    const parts = text.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return;
    const next = [...new Set([...tags, ...parts])];
    if (next.length > MAX_BLOG_TAGS) toast.error(`Up to ${MAX_BLOG_TAGS} tags`);
    onChange(next.slice(0, MAX_BLOG_TAGS));
    setText('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-xs text-brand-800">
            #{t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="hover:text-red-600"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-gray-400">No tags yet</span>}
      </div>
      <div className="relative has-icon">
        <Tag className="w-4 h-4 text-brand-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder="Type a tag and press Enter"
          className="dash-input"
          disabled={tags.length >= MAX_BLOG_TAGS}
        />
      </div>
    </div>
  );
}

function CoverPicker({ url, onChange }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast.error('Choose a JPG, PNG or WEBP image');
    if (file.size > MAX_IMAGE_BYTES) return toast.error('Image must be 5 MB or smaller');
    setProgress(0);
    try {
      const res = await adminApi.uploadBlogImage(file, setProgress);
      onChange(res.data.data.url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload the image');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={progress !== null}
        className="group relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-brand-400 bg-gray-50 flex items-center justify-center"
      >
        {url ? <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (
          <div className="text-center text-gray-400">
            <ImagePlus className="w-8 h-8 mx-auto mb-1" />
            <span className="text-xs font-semibold">Upload a cover image</span>
          </div>
        )}
        {progress !== null && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-xs font-semibold">
            <Loader2 className="w-6 h-6 animate-spin mb-1" />{progress < 100 ? `${progress}%` : 'Processing…'}
          </div>
        )}
        {url && progress === null && (
          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">Change image</span>
        )}
      </button>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
        <span>JPG, PNG or WEBP · 1600×900 works best</span>
        {url && <button type="button" onClick={() => onChange('')} className="text-red-600 font-semibold hover:underline">Remove</button>}
      </div>
      <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(',')} onChange={pick} className="hidden" />
    </div>
  );
}

function BlogForm({ blog }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !blog;
  const [form, setForm] = useState(() => toForm(blog));
  const [slugTouched, setSlugTouched] = useState(Boolean(blog?.slug));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(blog)));
  const dirty = JSON.stringify(form) !== saved;
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setSeo = (key) => (value) => setForm((f) => ({ ...f, seo: { ...f.seo, [key]: value } }));

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: (status) => {
      const body = { ...form, slug: form.slug || undefined, ...(status && { status }) };
      return isNew ? adminApi.createBlog(body) : adminApi.updateBlog(blog._id, body);
    },
    onSuccess: (res) => {
      const next = res.data.data.blog;
      setSaved(JSON.stringify(toForm(next)));
      setForm(toForm(next));
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.setQueryData(['admin', 'blog', next._id], { blog: next });
      toast.success(next.status === 'published' ? (blog?.status === 'published' ? 'Changes are live' : 'Post published') : 'Draft saved');
      if (isNew) navigate(`/admin/blogs/${next._id}`, { replace: true });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save the post'),
  });

  const remove = useMutation({
    mutationFn: () => adminApi.deleteBlog(blog._id),
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      navigate('/admin/blogs', { replace: true });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete the post'),
  });

  const status = blog?.status || 'draft';
  const published = status === 'published';
  const titleMissing = !form.title.trim();
  const tooLong = form.excerpt.length > MAX_BLOG_EXCERPT || form.seo.metaTitle.length > 70 || form.seo.metaDescription.length > 160;
  const blocked = titleMissing || tooLong || save.isPending;
  const previewTitle = form.seo.metaTitle || form.title || 'Post title';
  const previewDescription = form.seo.metaDescription || form.excerpt || 'A short description of the post appears here in search results.';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHero
        label="Content"
        title={isNew ? 'New blog post' : 'Edit blog post'}
        subtitle={isNew ? 'Write, then save as a draft or publish straight away' : form.title}
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Blog', to: '/admin/blogs' }, { label: isNew ? 'New post' : 'Edit' }]}
        action={<Link to="/admin/blogs" className="btn-brand-outline bg-white"><ArrowLeft className="w-4 h-4" /> All posts</Link>}
      />

      <div className="grid xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-5">
          <div className="dash-card p-5 space-y-5">
            <input
              value={form.title}
              onChange={(e) => {
                set('title')(e.target.value);
                if (!slugTouched) set('slug')(slugify(e.target.value));
              }}
              maxLength={160}
              placeholder="Post title"
              className="w-full text-2xl sm:text-3xl font-extrabold text-ink placeholder:text-gray-300 border-0 border-b border-gray-200 focus:border-brand-500 focus:ring-0 px-0 pb-3"
            />
            <Field label="URL slug" hint={`yoursite/blog/${form.slug || 'post-url'}`}>
              <TextInput value={form.slug} onChange={(v) => { setSlugTouched(true); set('slug')(slugify(v)); }} placeholder="generated-from-the-title" />
            </Field>
            <div>
              <Field label="Excerpt" hint={<span className="flex justify-between"><span>Shown on blog cards and as the default search description</span>{counter(form.excerpt, MAX_BLOG_EXCERPT)}</span>}>
                <TextArea value={form.excerpt} onChange={set('excerpt')} rows={3} />
              </Field>
            </div>
          </div>
          <RichTextEditor
            key={blog?._id || 'new'}
            value={form.content}
            onChange={set('content')}
            uploadImage={(file) => adminApi.uploadBlogImage(file).then((r) => r.data.data.url)}
            placeholder="Write the article… Use the toolbar for headings, lists, links and images."
          />
        </div>

        <div className="space-y-5 xl:sticky xl:top-4">
          <Panel title="Publishing" icon={Send}>
            <div className="flex items-center justify-between mb-4">
              <span className={`badge ${BLOG_STATUS_STYLES[status]}`}>{labelize(status)}</span>
              {dirty && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
            </div>
            {blog && (
              <dl className="text-xs text-gray-500 space-y-1 mb-4">
                {blog.publishedAt && <div className="flex justify-between"><dt>Published</dt><dd className="text-gray-700">{formatDateTime(blog.publishedAt)}</dd></div>}
                <div className="flex justify-between"><dt>Last saved</dt><dd className="text-gray-700">{formatDateTime(blog.updatedAt)}</dd></div>
                <div className="flex justify-between"><dt>Views</dt><dd className="text-gray-700 inline-flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(blog.views)}</dd></div>
                <div className="flex justify-between"><dt>Reading time</dt><dd className="text-gray-700">{blog.readingMinutes || 1} min</dd></div>
              </dl>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-5 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured')(e.target.checked)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <Star className="w-4 h-4 text-amber-500" /> Feature at the top of the blog
            </label>
            <div className="flex flex-col gap-2">
              {published ? (
                <>
                  <button type="button" disabled={blocked} onClick={() => save.mutate()} className="btn-brand justify-center disabled:opacity-50">
                    {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Update live post
                  </button>
                  <button type="button" disabled={blocked} onClick={() => save.mutate('draft')} className="btn-brand-outline justify-center disabled:opacity-50">
                    <Undo2 className="w-4 h-4" /> Unpublish
                  </button>
                </>
              ) : (
                <>
                  <button type="button" disabled={blocked} onClick={() => save.mutate('published')} className="btn-brand justify-center disabled:opacity-50">
                    {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publish
                  </button>
                  <button type="button" disabled={blocked} onClick={() => save.mutate('draft')} className="btn-brand-outline justify-center disabled:opacity-50">
                    <Save className="w-4 h-4" /> Save draft
                  </button>
                </>
              )}
              {published && blog?.slug && (
                <a href={`/blog/${blog.slug}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 hover:underline inline-flex items-center gap-1 justify-center mt-1">
                  View on the site <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {titleMissing && <p className="text-xs text-gray-500 text-center">Add a title to save.</p>}
            </div>
            {blog && (
              <button type="button" onClick={() => setConfirmDelete(true)} className="mt-5 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 hover:underline">
                <Trash2 className="w-3.5 h-3.5" /> Delete post
              </button>
            )}
          </Panel>

          <Panel title="Cover image" icon={ImagePlus}>
            <CoverPicker url={form.coverImageUrl} onChange={set('coverImageUrl')} />
          </Panel>

          <Panel title="Organise" icon={Tag}>
            <div className="space-y-5">
              <Field label="Category">
                <SelectInput value={form.category} onChange={set('category')} options={BLOG_CATEGORY_OPTIONS} placeholder="No category" />
              </Field>
              <TagInput tags={form.tags} onChange={set('tags')} />
            </div>
          </Panel>

          <Panel title="Search engines" icon={Search}>
            <div className="space-y-5">
              <Field label="Meta title" hint={<span className="flex justify-between"><span>Defaults to the post title</span>{counter(form.seo.metaTitle, 70)}</span>}>
                <TextInput value={form.seo.metaTitle} onChange={setSeo('metaTitle')} />
              </Field>
              <Field label="Meta description" hint={<span className="flex justify-between"><span>Defaults to the excerpt</span>{counter(form.seo.metaDescription, 160)}</span>}>
                <TextArea value={form.seo.metaDescription} onChange={setSeo('metaDescription')} rows={3} />
              </Field>
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="text-[11px] text-gray-500 truncate">{window.location.host}/blog/{form.slug || 'post-url'}</div>
                <div className="text-[#1a0dab] text-base leading-snug truncate">{previewTitle}</div>
                <div className="text-xs text-gray-600 line-clamp-2">{previewDescription}</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete “${blog.title}”?`}
          message="The post is deleted permanently and removed from the public blog."
          pending={remove.isPending}
          onConfirm={() => remove.mutate()}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

export default function AdminBlogEditorPage() {
  const { blogId } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'blog', blogId],
    queryFn: () => adminApi.getBlog(blogId).then((r) => r.data.data),
    enabled: Boolean(blogId),
  });

  if (!blogId) return <BlogForm key="new" />;
  if (isLoading) return <div className="p-4 sm:p-6 lg:p-8"><PageLoader /></div>;
  if (error) return <div className="p-4 sm:p-6 lg:p-8"><PageError error={error} backTo="/admin/blogs" backLabel="Back to the blog" /></div>;
  return <BlogForm key={data.blog._id} blog={data.blog} />;
}
