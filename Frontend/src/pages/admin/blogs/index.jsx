import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ExternalLink, Eye, FileText, Pencil, Plus, Star, Trash2, Upload, Undo2 } from 'lucide-react';
import { adminApi } from '../../../services/endpoints';
import useListParams from '../../../hooks/useListParams';
import PageHero from '../../../components/PageHero';
import { DataTable, Pagination } from '../../../components/admin/DataTable';
import ListToolbar from '../../../components/admin/ListToolbar';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { BLOG_CATEGORY_OPTIONS, BLOG_STATUS_STYLES } from '../../../data/adminOptions';
import { labelize } from '../../../data/propertyOptions';
import { accountName, formatDate, formatNumber, timeAgo } from '../../../utils/format';

export default function AdminBlogsPage() {
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState(null);
  const list = useListParams({ filters: ['status', 'category'] });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'blogs', list.query],
    queryFn: () => adminApi.getBlogs(list.query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });
  const counts = data?.counts || { draft: 0, published: 0 };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin'] });
  const togglePublish = useMutation({
    mutationFn: (blog) => adminApi.updateBlog(blog._id, { status: blog.status === 'published' ? 'draft' : 'published' }),
    onSuccess: (res) => {
      toast.success(res.data.data.blog.status === 'published' ? 'Published' : 'Moved back to drafts');
      refresh();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update the post'),
  });
  const remove = useMutation({
    mutationFn: (id) => adminApi.deleteBlog(id),
    onSuccess: () => { toast.success('Post deleted'); setToDelete(null); refresh(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete the post'),
  });

  const columns = [
    {
      key: 'post',
      label: 'Post',
      render: (b) => (
        <Link to={`/admin/blogs/${b._id}`} className="flex items-center gap-3 group min-w-0">
          {b.coverImageUrl ? (
            <img src={b.coverImageUrl} alt="" className="w-20 h-12 rounded-lg object-cover shrink-0 bg-gray-100" />
          ) : (
            <div className="w-20 h-12 rounded-lg bg-brand-50 text-brand-300 flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-ink truncate max-w-[320px] group-hover:text-brand-700 flex items-center gap-1">
              {b.isFeatured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />}
              {b.title}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[320px]">/blog/{b.slug}</div>
          </div>
        </Link>
      ),
    },
    { key: 'category', label: 'Category', render: (b) => <span className="text-xs text-gray-600">{b.category ? labelize(b.category) : '—'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (b) => (
        <div>
          <span className={`badge ${BLOG_STATUS_STYLES[b.status]}`}>{labelize(b.status)}</span>
          {b.publishedAt && <div className="text-[11px] text-gray-500 mt-1">{formatDate(b.publishedAt)}</div>}
        </div>
      ),
    },
    {
      key: 'views',
      label: 'Views',
      render: (b) => <span className="inline-flex items-center gap-1 text-sm text-gray-700"><Eye className="w-3.5 h-3.5 text-gray-400" />{formatNumber(b.views)}</span>,
    },
    { key: 'read', label: 'Read time', render: (b) => <span className="text-xs text-gray-600">{b.readingMinutes || 1} min</span> },
    { key: 'author', label: 'Author', render: (b) => <span className="text-xs text-gray-600">{b.author ? accountName(b.author) : '—'}</span> },
    { key: 'updated', label: 'Updated', render: (b) => <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(b.updatedAt)}</span> },
    {
      key: 'actions',
      label: '',
      headClassName: 'text-right',
      render: (b) => (
        <div className="flex justify-end gap-0.5">
          <Link to={`/admin/blogs/${b._id}`} title="Edit" className="p-2 rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-700"><Pencil className="w-4 h-4" /></Link>
          {b.status === 'published' && (
            <a href={`/blog/${b.slug}`} target="_blank" rel="noreferrer" title="View on the site" className="p-2 rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-700"><ExternalLink className="w-4 h-4" /></a>
          )}
          <button
            type="button"
            title={b.status === 'published' ? 'Unpublish' : 'Publish'}
            disabled={togglePublish.isPending && togglePublish.variables?._id === b._id}
            onClick={() => togglePublish.mutate(b)}
            className={`p-2 rounded-lg disabled:opacity-40 ${b.status === 'published' ? 'text-gray-500 hover:bg-amber-50 hover:text-amber-700' : 'text-green-600 hover:bg-green-50'}`}
          >
            {b.status === 'published' ? <Undo2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          </button>
          <button type="button" title="Delete" onClick={() => setToDelete(b)} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const status = list.filters.status;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHero
        label="Content"
        title="Blog"
        subtitle="Guides, news and market insight shown on the public blog"
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Blog' }]}
        tabs={[
          { key: 'all', label: `All (${counts.draft + counts.published})` },
          { key: 'published', label: `Published (${counts.published})` },
          { key: 'draft', label: `Drafts (${counts.draft})` },
        ]}
        activeTab={status || 'all'}
        onTabChange={(key) => list.setFilter('status', key === 'all' ? '' : key)}
        action={<Link to="/admin/blogs/new" className="btn-brand"><Plus className="w-4 h-4" /> New post</Link>}
      />
      <div className="dash-card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <ListToolbar
            search={list.search}
            onSearch={list.setSearch}
            placeholder="Search by title, excerpt or tag…"
            filters={[{ key: 'category', value: list.filters.category, onChange: (v) => list.setFilter('category', v), options: BLOG_CATEGORY_OPTIONS, placeholder: 'All categories' }]}
            hasFilters={Boolean(list.search || list.filters.category)}
            onClear={list.clear}
          />
        </div>
        <DataTable
          columns={columns}
          rows={data?.items}
          loading={isLoading}
          fetching={isFetching}
          empty={
            <div className="py-4">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 mb-4">No posts here yet</p>
              <Link to="/admin/blogs/new" className="btn-brand inline-flex"><Plus className="w-4 h-4" /> Write the first post</Link>
            </div>
          }
          minWidth={1000}
        />
        <Pagination pagination={data?.pagination} page={list.page} limit={list.limit} onPage={list.setPage} onLimit={list.setLimit} />
      </div>

      {toDelete && (
        <ConfirmDialog
          title={`Delete “${toDelete.title}”?`}
          message={toDelete.status === 'published' ? 'The post is removed from the public blog straight away. This cannot be undone.' : 'The draft is deleted permanently.'}
          pending={remove.isPending}
          onConfirm={() => remove.mutate(toDelete._id)}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
