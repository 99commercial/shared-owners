import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../guards/ProtectedRoute';
import GuestRoute from '../guards/GuestRoute';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import OrgLayout from '../layouts/OrgLayout';
import OrgAdminLayout from '../layouts/OrgAdminLayout';
import OrgUserLayout from '../layouts/OrgUserLayout';
import UserLayout from '../layouts/UserLayout';

// Public pages
import HomePage from '../pages/home';
import PropertiesPage from '../pages/public/properties';
import PropertyDetailPage from '../pages/public/property-detail';
import DevelopmentsPage from '../pages/public/developments';
import DevelopmentDetailPage from '../pages/public/development-detail';
import CompaniesPage from '../pages/public/companies';
import CompanyDetailPage from '../pages/public/company-detail';
import ContactPage from '../pages/public/contact';
import AboutPage from '../pages/public/about';
import BlogPage from '../pages/public/blog';
import BlogDetailPage from '../pages/public/blog-detail';
import ImpersonatePage from '../pages/impersonate';

// Auth pages
import LoginPage from '../pages/auth/login';
import RegisterPage from '../pages/auth/register';
import ForgotPasswordPage from '../pages/auth/forgot-password';
import ResetPasswordPage from '../pages/auth/reset-password';
import VerifyEmailPage from '../pages/auth/verify-email';
import ResendVerificationPage from '../pages/auth/resend-verification';

// Admin pages
import AdminDashboardPage from '../pages/admin/dashboard';
import AdminAccountAnalyticsPage from '../pages/admin/analytics-accounts';
import AdminPropertyAnalyticsPage from '../pages/admin/analytics-properties';
import AdminDevelopmentAnalyticsPage from '../pages/admin/analytics-developments';
import AdminUsersPage from '../pages/admin/users';
import AdminUserDetailPage from '../pages/admin/user-detail';
import AdminCompaniesPage from '../pages/admin/companies';
import AdminCompanyDetailPage from '../pages/admin/company-detail';
import AdminMemberDetailPage from '../pages/admin/member-detail';
import AdminPropertiesPage from '../pages/admin/properties';
import AdminDevelopmentsPage from '../pages/admin/developments';
import AdminApprovalsPage from '../pages/admin/approvals';
import AdminBlogsPage from '../pages/admin/blogs';
import AdminBlogEditorPage from '../pages/admin/blog-editor';
import AdminQueriesPage from '../pages/admin/queries';
import AdminProfilePage from '../pages/admin/profile';

// Organisation pages
import OrgDashboardPage from '../pages/organisation/dashboard';
import OrgAdminsPage from '../pages/organisation/admins';
import OrgUsersPage from '../pages/organisation/users';
import OrgPropertiesPage from '../pages/organisation/properties';
import OrgPropertyEditorPage from '../pages/organisation/property-editor';
import OrgDevelopmentsPage from '../pages/organisation/developments';
import OrgDevelopmentEditorPage from '../pages/organisation/development-editor';
import OrgCreateAdminPage from '../pages/organisation/admin-new';
import OrgCreateUserPage from '../pages/organisation/user-new';
import OrgProfilePage from '../pages/organisation/profile';

// Org Admin pages
import OrgAdminDashboardPage from '../pages/org-admin/dashboard';
import OrgAdminUsersPage from '../pages/org-admin/users';
import OrgAdminCreateUserPage from '../pages/org-admin/user-new';
import OrgAdminPropertiesPage from '../pages/org-admin/properties';
import OrgAdminPropertyEditorPage from '../pages/org-admin/property-editor';
import OrgAdminDevelopmentsPage from '../pages/org-admin/developments';
import OrgAdminDevelopmentEditorPage from '../pages/org-admin/development-editor';
import OrgAdminProfilePage from '../pages/org-admin/profile';

// Org User pages
import OrgUserDashboardPage from '../pages/org-user/dashboard';
import OrgUserPropertiesPage from '../pages/org-user/properties';
import OrgUserPropertyEditorPage from '../pages/org-user/property-editor';
import OrgUserDevelopmentsPage from '../pages/org-user/developments';
import OrgUserDevelopmentEditorPage from '../pages/org-user/development-editor';
import OrgUserProfilePage from '../pages/org-user/profile';

// User pages
import UserDashboardPage from '../pages/user/dashboard';
import UserPropertiesPage from '../pages/user/properties';
import UserPropertyDetailPage from '../pages/user/property-detail';
import UserCreatePropertyPage from '../pages/user/create-property';
import UserProfilePage from '../pages/user/profile';
import UserAccountPage from '../pages/user/account';
import MessagesLayout, { MessagesHome } from '../pages/messages';
import MessageThreadPage from '../pages/messages/thread';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
        <Route path="/developments" element={<DevelopmentsPage />} />
        <Route path="/developments/:developmentId" element={<DevelopmentDetailPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:slug" element={<CompanyDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
      </Route>

      {/* Tab opened by an admin's "Open account"; it signs itself in, so no guard */}
      <Route path="/impersonate/:key" element={<ImpersonatePage />} />

      {/* Auth (same public navbar, no footer) */}
      <Route element={<PublicLayout showFooter={false} />}>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="analytics/accounts" element={<AdminAccountAnalyticsPage />} />
        <Route path="analytics/properties" element={<AdminPropertyAnalyticsPage />} />
        <Route path="analytics/developments" element={<AdminDevelopmentAnalyticsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:userId" element={<AdminUserDetailPage />} />
        <Route path="companies" element={<AdminCompaniesPage />} />
        <Route path="companies/:companyId" element={<AdminCompanyDetailPage />} />
        <Route path="companies/:companyId/:memberType/:memberId" element={<AdminMemberDetailPage />} />
        <Route path="properties" element={<AdminPropertiesPage />} />
        <Route path="developments" element={<AdminDevelopmentsPage />} />
        <Route path="approvals" element={<AdminApprovalsPage />} />
        <Route path="blogs" element={<AdminBlogsPage />} />
        <Route path="blogs/new" element={<AdminBlogEditorPage />} />
        <Route path="blogs/:blogId" element={<AdminBlogEditorPage />} />
        <Route path="queries" element={<AdminQueriesPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      {/* Organisation */}
      <Route path="/org" element={<ProtectedRoute allowedRoles={['organisation']}><OrgLayout /></ProtectedRoute>}>
        <Route index element={<OrgDashboardPage />} />
        <Route path="admins" element={<OrgAdminsPage />} />
        <Route path="admins/new" element={<OrgCreateAdminPage />} />
        <Route path="users" element={<OrgUsersPage />} />
        <Route path="users/new" element={<OrgCreateUserPage />} />
        <Route path="properties" element={<OrgPropertiesPage />} />
        <Route path="properties/new" element={<OrgPropertyEditorPage />} />
        <Route path="properties/:propertyId" element={<OrgPropertyEditorPage />} />
        <Route path="developments" element={<OrgDevelopmentsPage />} />
        <Route path="developments/new" element={<OrgDevelopmentEditorPage />} />
        <Route path="developments/:developmentId" element={<OrgDevelopmentEditorPage />} />
        <Route path="messages" element={<MessagesLayout />}>
          <Route index element={<MessagesHome />} />
          <Route path=":conversationId" element={<MessageThreadPage />} />
        </Route>
        <Route path="profile" element={<OrgProfilePage />} />
      </Route>

      {/* Organisation Admin */}
      <Route path="/org-admin" element={<ProtectedRoute allowedRoles={['organisation-admin']}><OrgAdminLayout /></ProtectedRoute>}>
        <Route index element={<OrgAdminDashboardPage />} />
        <Route path="users" element={<OrgAdminUsersPage />} />
        <Route path="users/new" element={<OrgAdminCreateUserPage />} />
        <Route path="properties" element={<OrgAdminPropertiesPage />} />
        <Route path="properties/new" element={<OrgAdminPropertyEditorPage />} />
        <Route path="properties/:propertyId" element={<OrgAdminPropertyEditorPage />} />
        <Route path="developments" element={<OrgAdminDevelopmentsPage />} />
        <Route path="developments/new" element={<OrgAdminDevelopmentEditorPage />} />
        <Route path="developments/:developmentId" element={<OrgAdminDevelopmentEditorPage />} />
        <Route path="messages" element={<MessagesLayout />}>
          <Route index element={<MessagesHome />} />
          <Route path=":conversationId" element={<MessageThreadPage />} />
        </Route>
        <Route path="profile" element={<OrgAdminProfilePage />} />
      </Route>

      {/* Organisation User */}
      <Route path="/org-user" element={<ProtectedRoute allowedRoles={['organisation-user']}><OrgUserLayout /></ProtectedRoute>}>
        <Route index element={<OrgUserDashboardPage />} />
        <Route path="properties" element={<OrgUserPropertiesPage />} />
        <Route path="properties/new" element={<OrgUserPropertyEditorPage />} />
        <Route path="properties/:propertyId" element={<OrgUserPropertyEditorPage />} />
        <Route path="developments" element={<OrgUserDevelopmentsPage />} />
        <Route path="developments/new" element={<OrgUserDevelopmentEditorPage />} />
        <Route path="developments/:developmentId" element={<OrgUserDevelopmentEditorPage />} />
        <Route path="messages" element={<MessagesLayout />}>
          <Route index element={<MessagesHome />} />
          <Route path=":conversationId" element={<MessageThreadPage />} />
        </Route>
        <Route path="profile" element={<OrgUserProfilePage />} />
      </Route>

      {/* User */}
      <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><UserLayout /></ProtectedRoute>}>
        <Route index element={<UserDashboardPage />} />
        <Route path="properties" element={<UserPropertiesPage />} />
        <Route path="properties/new" element={<UserCreatePropertyPage />} />
        <Route path="properties/:propertyId" element={<UserPropertyDetailPage />} />
        <Route path="messages" element={<MessagesLayout />}>
          <Route index element={<MessagesHome />} />
          <Route path=":conversationId" element={<MessageThreadPage />} />
        </Route>
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="account" element={<UserAccountPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
