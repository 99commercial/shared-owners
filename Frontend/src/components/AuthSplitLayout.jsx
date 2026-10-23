import { CheckCircle2 } from 'lucide-react';

/**
 * Form on the left, illustration panel on the right. The panel is hidden below
 * the lg breakpoint so the form keeps the full width on phones and tablets.
 */
export default function AuthSplitLayout({ image, imageAlt, title, subtitle, highlights = [], children }) {
  return (
    <div className="flex-1 flex">
      <div className="flex-1 lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-8 bg-gradient-to-br from-primary-50 to-blue-100 lg:bg-none lg:bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>

      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center px-12 xl:px-16 py-12 bg-gradient-to-br from-primary-50 via-blue-50 to-primary-100">
        <div aria-hidden className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-100/70" />
        <div aria-hidden className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/60" />

        <div className="relative w-full max-w-xl">
          {/* The illustrations have an opaque white background; multiply lets the panel show through it */}
          <img src={image} alt={imageAlt} className="w-full h-auto max-h-[52vh] object-contain mix-blend-multiply" />

          <div className="mt-10 text-center">
            <h2 className="text-2xl xl:text-3xl font-bold text-gray-900 leading-tight">{title}</h2>
            {subtitle && <p className="mt-3 text-gray-600 leading-relaxed">{subtitle}</p>}
          </div>

          {highlights.length > 0 && (
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-primary-600" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
