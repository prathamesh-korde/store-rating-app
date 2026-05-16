import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Store, Lock, LogOut, Menu, X, Star, ChevronRight,
  Bell, Calendar, ChevronDown, TrendingUp, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { AIChatWidget } from '../components/ui/AIChatWidget';

const navItems = [
  { to: '/owner', label: 'My Store', icon: Store, end: true },
  { to: '/owner/profile', label: 'My Profile', icon: User },
  { to: '/owner/change-password', label: 'Change Password', icon: Lock },
];

function getTodayStr() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

const NOTIFICATIONS = [
  { id: 1, msg: 'A new rating has been submitted for your store', time: '3m ago', unread: true },
  { id: 2, msg: 'Your store dashboard has been updated', time: '2h ago', unread: false },
];

export function OwnerLayout() {
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

  const initials = user?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'O';
  const firstName = user?.name?.split(' ')[0] || 'Owner';

  return (
    <div className="main-layout bg-slate-100 min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="px-6 py-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <Star size={17} className="text-white fill-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-white text-base leading-tight">StoreRate</p>
            <span className="text-xs text-emerald-400 font-medium">Store Owner</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Owner navigation">
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

        <div className="px-3 py-4 border-t border-white/5 space-y-2 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => { navigate('/owner/profile'); setSidebarOpen(false); }}>
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight">{firstName}</p>
              <p className="text-xs text-slate-500 truncate">Store Owner</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            id="owner-logout-btn">
            <LogOut size={17} className="nav-icon flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Toggle sidebar">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1 hidden sm:block">
            <p className="font-bold text-slate-800 text-sm">Store Owner Dashboard</p>
            <p className="text-xs text-slate-400">Track ratings &amp; manage your store</p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <Calendar size={14} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-600">{getTodayStr()}</span>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button id="owner-notif-btn"
                onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Notifications">
                <Bell size={19} className="text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-scaleIn">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="font-bold text-slate-800 text-sm">Notifications</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-emerald-600 font-medium">Mark all read</button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {notifications.map(n => (
                      <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 ${n.unread ? 'bg-emerald-50/60' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? 'bg-emerald-500' : 'bg-slate-300'}`} />
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
              <button id="owner-profile-btn"
                onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{firstName}</p>
                  <p className="text-[10px] text-slate-400">Store Owner</p>
                </div>
                <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
              </button>
              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-scaleIn">
                  <div className="px-4 py-3 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{firstName}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      <TrendingUp size={10} /> Store Owner
                    </span>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { setShowProfile(false); navigate('/owner/profile'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-emerald-50 text-sm text-slate-700 font-medium transition-colors"
                      id="owner-profile-link">
                      <User size={15} className="text-emerald-500" /> My Profile
                    </button>
                    <button onClick={() => { setShowProfile(false); navigate('/owner/change-password'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 font-medium transition-colors">
                      <Lock size={15} className="text-slate-400" /> Change Password
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 font-medium transition-colors"
                      id="owner-topbar-logout-btn">
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
