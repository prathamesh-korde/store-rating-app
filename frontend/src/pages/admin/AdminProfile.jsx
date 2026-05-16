import { useAuth } from '../../context/AuthContext';
import { User, Mail, MapPin, Shield, Calendar } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export function AdminProfile() {
  const { user } = useAuth();

  const fields = [
    { icon: User, label: 'Full Name', value: user?.name || '—' },
    { icon: Mail, label: 'Email', value: user?.email || '—' },
    { icon: MapPin, label: 'Address', value: user?.address || '—' },
    { icon: Shield, label: 'Role', value: 'System Administrator' },
    { icon: Calendar, label: 'Member Since', value: formatDate(user?.created_at) },
  ];

  const initials = user?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'A';

  return (
    <div className="max-w-2xl mx-auto animate-slideUp">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-indigo-200 text-sm mt-1">{user?.email}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
            <Shield size={12} /> System Admin
          </span>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-0">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-sm text-slate-800 font-medium mt-0.5 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
