import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, FileText, Loader2, Search, Star } from 'lucide-react';
import { commonApi } from '../../../services/endpoints';
import { BLOG_CATEGORY_OPTIONS } from '../../../data/adminOptions';
import { labelize } from '../../../data/propertyOptions';
import { formatDate } from '../../../utils/format';

const PAGE_SIZE = 9;

function PostCard({ post, large = false }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex ${large ? 'flex-col lg:flex-row' : 'flex-col'}`}
    >
      <div className={`relative bg-primary-50 overflow-hidden ${large ? 'lg:w-3/5 aspect-video lg:aspect-auto' : 'aspect-video'}`}>
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-primary-200"><FileText className="w-12 h-12" /></div>
        )}
        {post.isFeatured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 px-2.5 py-1 text-[11px] font-bold">
            <Star className="w-3 h-3 fill-current" /> Featured
          </span>
        )}
      </div>
      <div className={`p-6 flex flex-col flex-1 ${large ? 'lg:p-10 justify-center' : ''}`}>
        {post.category && <span className="text-xs font-bold uppercase tracking-wider text-primary-600">{labelize(post.category)}</span>}
        <h2 className={`font-bold text-gray-900 mt-2 group-hover:text-primary-700 ${large ? 'text-2xl lg:text-3xl' : 'text-lg line-clamp-2'}`}>{post.title}</h2>
        {post.excerpt && <p className={`text-gray-500 mt-3 ${large ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'}`}>{post.excerpt}</p>}
        <div className="mt-auto pt-5 flex items-center justify-between text-xs text-gray-400">
          <span>{formatDate(post.publishedAt)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readingMinutes || 1} min read</span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const page = Number(params.get('page')) || 1;
  const urlSearch = params.get('search') || '';
  const [search, setSearch] = useState(urlSearch);

  const update = (patch) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, String(v)) : next.delete(k)));
      if (!('page' in patch)) next.delete('page');
      return next;
    });

  useEffect(() => {
    if (search.trim() === urlSearch) return undefined;
    const timer = setTimeout(() => update({ search: search.trim() }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, urlSearch]);

  const query = { page, limit: PAGE_SIZE, ...(category && { category }), ...(urlSearch && { search: urlSearch }) };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['public', 'blogs', query],
    queryFn: () => commonApi.getBlogs(query).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });

  useEffect(() => { document.title = 'Blog — Shared Ownership'; }, []);

  const items = data?.items || [];
  const showHero = page === 1 && !category && !urlSearch && items[0]?.isFeatured;
  const [hero, ...rest] = showHero ? items : [null, ...items];
  const pagination = data?.pagination;

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-100 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider">Blog</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-4">Guides & insights</h1>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Everything you need to know about shared ownership, new developments and the housing market.</p>
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="w-full rounded-full border border-gray-200 bg-white pl-12 pr-5 py-3.5 text-sm shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 outline-none"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[{ value: '', label: 'All' }, ...BLOG_CATEGORY_OPTIONS].map((c) => (
            <button
              key={c.value || 'all'}
              type="button"
              onClick={() => update({ category: c.value })}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                category === c.value ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{urlSearch || category ? 'No articles match your search.' : 'No articles have been published yet.'}</p>
          </div>
        ) : (
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            {hero && <div className="mb-10"><PostCard post={hero} large /></div>}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((post) => <PostCard key={post._id} post={post} />)}
            </div>
            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button type="button" disabled={page <= 1} onClick={() => update({ page: page - 1 })} className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-primary-300">
                  <ChevronLeft className="w-4 h-4" /> Newer
                </button>
                <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
                <button type="button" disabled={page >= pagination.totalPages} onClick={() => update({ page: page + 1 })} className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-primary-300">
                  Older <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-16 rounded-3xl bg-primary-600 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Ready to find your home?</h3>
            <p className="text-white/80 mt-1">Browse shared-ownership properties across the UK.</p>
          </div>
          <Link to="/properties" className="inline-flex items-center gap-2 rounded-full bg-white text-primary-700 px-6 py-3 font-semibold hover:bg-primary-50">
            Browse properties <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
