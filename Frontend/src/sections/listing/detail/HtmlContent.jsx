/** Rich text written in the listing editor; the API sanitises it before saving */
export default function HtmlContent({ html, className = '' }) {
  if (!html) return null;
  return <div className={`article-body ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
