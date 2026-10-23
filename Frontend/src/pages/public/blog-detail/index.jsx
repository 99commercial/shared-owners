import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, FileText, Loader2 } from 'lucide-react';
import { commonApi } from '../../../services/endpoints';
import { labelize } from '../../../data/propertyOptions';
import { formatDate } from '../../../utils/format';

const setMetaDescription = (content) => {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'description';
    document.head.appendChild(tag);
  }
  tag.content = content || '';
};

export default function BlogDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public', 'blog', slug],
    queryFn: () => commonApi.getBlog(slug).then((r) => r.data.data),
    staleTime: Infinity,
  });
  const blog = data?.blog;

  useEffect(() => {
    if (!blog) return;
    document.title = `${blog.seo?.metaTitle || blog.title} — Shared Ownership`;
    setMetaDescription(blog.seo?.metaDescription || blog.excerpt);
    window.scrollTo(0, 0);
  }, [blog]);

  if (isLoading) return <div className="py-32 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-32 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">Article not found</h1>
        <p className="text-gray-500 mt-2">It may have been moved or unpublished.</p>
        <Link to="/blog" className="btn-primary inline-flex mt-6">Back to the blog</Link>
      </div>
    );
  }

  const author = blog.author?.adminProfile;
  const authorName = author ? `${author.firstName} ${author.lastName || ''}`.trim() : 'Shared Ownership team';

  return (
    <article className="pb-16">
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 text-center">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700"><ArrowLeft className="w-4 h-4" /> All articles</Link>
        {blog.category && (
          <div className="mt-6">
            <Link to={`/blog?category=${blog.category}`} className="text-xs font-bold uppercase tracking-wider text-primary-600 hover:underline">{labelize(blog.category)}</Link>
          </div>
        )}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mt-3 leading-tight">{blog.title}</h1>
        {blog.excerpt && <p className="text-lg text-gray-500 mt-5">{blog.excerpt}</p>}
        <div className="flex items-center justify-center gap-3 mt-8 text-sm text-gray-500">
          {author?.avatarUrl ? (
            <img src={author.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center">{authorName.charAt(0)}</div>
          )}
          <div className="text-left">
            <div className="font-semibold text-gray-900">{authorName}</div>
            <div className="flex items-center gap-2 text-xs">
              <span>{formatDate(blog.publishedAt)}</span>·<span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{blog.readingMinutes || 1} min read</span>
            </div>
          </div>
        </div>
      </header>

      {blog.coverImageUrl && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
          <img src={blog.coverImageUrl} alt="" className="w-full aspect-video object-cover rounded-3xl shadow-lg" />
        </div>
      )}

      {/* Content is sanitised by the API (Backend/src/utils/richText.js) before it is stored */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 article-body text-[17px]" dangerouslySetInnerHTML={{ __html: blog.content || '' }} />

      {blog.tags?.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-10 flex flex-wrap gap-2">
          {blog.tags.map((t) => (
            <Link key={t} to={`/blog?search=${encodeURIComponent(t)}`} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-primary-50 hover:text-primary-700">#{t}</Link>
          ))}
        </div>
      )}

      {data.related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Keep reading</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {data.related.map((post) => (
              <Link key={post._id} to={`/blog/${post.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-primary-50 relative overflow-hidden">
                  {post.coverImageUrl ? (
                    <img src={post.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-primary-200"><FileText className="w-10 h-10" /></div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-primary-700">{post.title}</h3>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(post.publishedAt)} · {post.readingMinutes || 1} min read</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
