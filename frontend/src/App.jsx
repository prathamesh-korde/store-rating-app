import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { UserLayout } from './layouts/UserLayout';
import { OwnerLayout } from './layouts/OwnerLayout';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminStores } from './pages/admin/AdminStores';
import { AdminAddUser } from './pages/admin/AdminAddUser';
import { AdminStoreDetail } from './pages/admin/AdminStoreDetail';
import { AdminProfile } from './pages/admin/AdminProfile';

// User pages
import { UserDashboard } from './pages/user/UserDashboard';
import { UserStoreDetail } from './pages/user/UserStoreDetail';
import { UserProfile } from './pages/user/UserProfile';
import { UserMapPage } from './pages/user/UserMapPage';
import { ChangePassword as UserChangePassword } from './pages/user/ChangePassword';

// Owner pages
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerProfile } from './pages/owner/OwnerProfile';
import { ChangePassword as OwnerChangePassword } from './pages/owner/ChangePassword';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/new" element={<AdminAddUser />} />
              <Route path="stores" element={<AdminStores />} />
              <Route path="stores/:id" element={<AdminStoreDetail />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            {/* Normal user routes */}
            <Route
              path="/user"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="stores" replace />} />
              <Route path="stores" element={<UserDashboard />} />
              <Route path="stores/:id" element={<UserStoreDetail />} />
              <Route path="map" element={<UserMapPage />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="change-password" element={<UserChangePassword />} />
            </Route>

            {/* Store owner routes */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OwnerDashboard />} />
              <Route path="profile" element={<OwnerProfile />} />
              <Route path="change-password" element={<OwnerChangePassword />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
