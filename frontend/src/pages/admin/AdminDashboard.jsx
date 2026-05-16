import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Store, Star, ArrowRight, TrendingUp, Clock, MapPin, MessageSquare } from 'lucide-react';
import { getDashboard } from '../../api/users.api';
import { getTopRatedStores, getRecentStores } from '../../api/stores.api';
import { useToast } from '../../components/ui/Toast';
import { getApiError, formatRating } from '../../utils/formatters';

const STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=260&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=260&fit=crop',
  'https://images.unsplash.com/photo-1528698827591-e625c7e0f7b8?w=400&h=260&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=260&fit=crop',
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=260&fit=crop',
  'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&h=260&fit=crop',
  'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=400&h=260&fit=crop',
  'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400&h=260&fit=crop',
];

function getStoreImage(store, index) {
  return store.image_url || STOCK_IMAGES[index % STOCK_IMAGES.length];
}

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {loading ? (
          <div className="skeleton h-8 w-20 mt-1" />
        ) : (
          <p className="text-3xl font-bold font-heading text-slate-800">{value?.toLocaleString() ?? '—'}</p>
        )}
      </div>
    </div>
  );
}

function StoreCard({ store, index, badge, navigate }) {
  const img = getStoreImage(store, index);
  return (
    <div
      onClick={() => navigate(`/admin/stores/${store.id}`)}
      className="card overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={img}
          alt={store.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = STOCK_IMAGES[0]; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-lg">
            {badge}
          </span>
        )}
        {store.avg_rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-white text-xs font-bold">{formatRating(store.avg_rating)}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {store.name}
        </h4>
        {store.address && (
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 line-clamp-1">
            <MapPin size={11} className="flex-shrink-0" />
            {store.address}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {store.owner_name || 'Unassigned'}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <MessageSquare size={11} />
            {store.total_ratings || 0} ratings
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [topStores, setTopStores] = useState([]);
  const [recentStores, setRecentStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getDashboard().then(res => setStats(res.data.data)).catch(() => {}),
      getTopRatedStores().then(res => setTopStores(res.data.data || [])).catch(() => {}),
      getRecentStores().then(res => setRecentStores(res.data.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-slideUp">
      {/* Page Header */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-800">System Dashboard</h2>
        <p className="text-slate-500 mt-1 text-sm">Overview of platform activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="bg-indigo-500" loading={loading} />
        <StatCard icon={Store} label="Total Stores" value={stats?.totalStores} color="bg-emerald-500" loading={loading} />
        <StatCard icon={Star} label="Total Ratings" value={stats?.totalRatings} color="bg-amber-500" loading={loading} />
      </div>

      {/* Top Rated Stores */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500" />
            <h3 className="font-heading text-lg font-semibold text-slate-700">Top Rated Stores</h3>
          </div>
          <Link to="/admin/stores" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton h-40" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : topStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topStores.map((store, i) => (
              <StoreCard key={store.id} store={store} index={i} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-slate-400 text-sm">No rated stores yet.</div>
        )}
      </div>

      {/* Recently Added Stores */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-emerald-500" />
            <h3 className="font-heading text-lg font-semibold text-slate-700">Recently Added</h3>
          </div>
          <Link to="/admin/stores" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton h-40" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentStores.map((store, i) => (
              <StoreCard key={store.id} store={store} index={i + 4} badge="New" navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-slate-400 text-sm">No stores added yet.</div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-slate-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { to: '/admin/users', label: 'Manage Users', desc: 'View, filter, and manage all platform users', icon: Users, color: 'text-indigo-500' },
            { to: '/admin/stores', label: 'Manage Stores', desc: 'Browse stores and view ratings', icon: Store, color: 'text-emerald-500' },
            { to: '/admin/users/new', label: 'Add New User', desc: 'Create admin, user, or store owner account', icon: TrendingUp, color: 'text-amber-500' },
          ].map(({ to, label, desc, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className="card p-5 hover:shadow-lg transition-all group flex items-start gap-4 hover:-translate-y-0.5"
            >
              <div className={`${color} mt-0.5`}><Icon size={22} /></div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all mt-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
