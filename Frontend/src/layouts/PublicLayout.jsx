import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/**
 * Shell for every page that works without logging in. Without the footer
 * (auth pages), the page content stretches to fill the space below the navbar.
 */
export default function PublicLayout({ showFooter = true }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={showFooter ? 'flex-1' : 'flex-1 flex flex-col'}>
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
