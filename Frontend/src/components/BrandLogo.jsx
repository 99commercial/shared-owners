/** Site brand mark — `public/shared_owner_logo.png` */

const SIZES = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-36 w-36',
  nav: 'h-24 w-auto',
  sidebar: 'h-24 w-auto max-w-[280px]',
};

export default function BrandLogo({ size = 'nav', className = '', alt = 'Shared Owner' }) {
  return (
    <img
      src="/shared_owner_logo.png"
      alt={alt}
      className={`${SIZES[size] || SIZES.nav} object-contain rounded-xl ${className}`}
    />
  );
}
