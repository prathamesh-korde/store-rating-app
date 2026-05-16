import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Store, Lock, LogOut, Menu, X, Star, ChevronRight,
  Bell, Calendar, ChevronDown, ShoppingBag,
  Map, User, Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { AIChatWidget } from '../components/ui/AIChatWidget';

const navItems = [
  { to: '/user/stores', label: 'Browse Stores', icon: Store, end: true },
  { to: '/user/map', label: 'Map View', icon: Map },
  { to: '/user/profile', label: 'My Profile', icon: User },
  { to: '/user/change-password', label: 'Change Password', icon: Lock },
];

function getTodayStr() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

const NOTIFICATIONS = [
  { id: 1, msg: 'New stores have been added to the platform', time: '5m ago', unread: true },
  { id: 2, msg: 'Your rating was recorded successfully', time: '1h ago', unread: false },
];

export function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = async () => {
    setShowProfile(false);
    await logout();
    addToast({ message: 'Logged out successfully.', type: 'info' });
    navigate('/login', { replace: true });
  };

  const markAllRead = () => setNotifications(n => n.map(item => ({ ...item, unread: false })));

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'U';
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="main-layout bg-slate-100 min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <Star size={17} className="text-white fill-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-white text-base leading-tight">StoreRate</p>
            <span className="text-xs text-sky-400 font-medium">Consumer Portal</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="User navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item group ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={17} className="nav-icon flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={13} className="opacity-0 group-hover:opacity-40 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="px-3 py-4 border-t border-white/5 space-y-2 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => { navigate('/user/profile'); setSidebarOpen(false); }}>
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight">{firstName}</p>
              <p className="text-xs text-slate-500 truncate">Consumer</p>
            </div>
            <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
          </div>
          <button
            onClick={handleLogout}
            className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            id="user-logout-btn"
          >
            <LogOut size={17} className="nav-icon flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1 hidden sm:block">
            <p className="font-bold text-slate-800 text-sm">Consumer Portal</p>
            <p className="text-xs text-slate-400">Browse &amp; rate local stores</p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Date */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <Calendar size={14} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-600">{getTodayStr()}</span>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                id="user-notif-btn"
                onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={19} className="text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white" />
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-scaleIn">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="font-bold text-slate-800 text-sm">Notifications</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-sky-600 hover:text-sky-800 font-medium">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {notifications.map(n => (
                      <div key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 ${n.unread ? 'bg-sky-50/60' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? 'bg-sky-500' : 'bg-slate-300'}`} />
                        <div>
                          <p className="text-xs text-slate-800 font-medium leading-relaxed">{n.msg}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                id="user-profile-btn"
                onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{firstName}</p>
                  <p className="text-[10px] text-slate-400">Consumer</p>
                </div>
                <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
              </button>
              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-scaleIn">
                  <div className="px-4 py-3 bg-gradient-to-br from-sky-50 to-cyan-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{user?.name?.split(' ')[0]}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">
                      <ShoppingBag size={10} /> Consumer
                    </span>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { setShowProfile(false); navigate('/user/profile'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-sky-50 text-sm text-slate-700 font-medium transition-colors"
                      id="user-profile-link">
                      <User size={15} className="text-sky-500" /> My Profile
                    </button>
                    <button onClick={() => { setShowProfile(false); navigate('/user/change-password'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 font-medium transition-colors">
                      <Lock size={15} className="text-slate-400" /> Change Password
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 font-medium transition-colors"
                      id="user-topbar-logout-btn">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-6"><Outlet /></main>
      </div>
      <AIChatWidget />
    </div>
  );
}
