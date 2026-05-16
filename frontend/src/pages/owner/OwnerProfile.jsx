import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Mail, MapPin, Lock, Store, TrendingUp, ArrowRight } from 'lucide-react';

export function OwnerProfile() {
  const { user } = useAuth();
  const initials = user?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'O';

  return (
    <div className="space-y-6 animate-slideUp max-w-2xl mx-auto">
      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-slate-500 text-sm mt-0.5">Your store owner account information</p>
      </div>

      <div className="card p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">{initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="font-heading text-2xl font-bold text-slate-800">{user?.name}</h3>
            <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                <Store size={12} /> Store Owner
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card divide-y divide-slate-100">
        {[
          { label: 'Full Name', value: user?.name, icon: User },
          { label: 'Email Address', value: user?.email, icon: Mail },
          { label: 'Address', value: user?.address || 'Not provided', icon: MapPin },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 px-6 py-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card divide-y divide-slate-100">
        <p className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</p>
        <Link to="/owner" className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">Store Dashboard</p>
            <p className="text-xs text-slate-400">View ratings and customer reviews</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
        </Link>
        <Link to="/owner/change-password" className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Lock size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">Change Password</p>
            <p className="text-xs text-slate-400">Update your login password</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}
