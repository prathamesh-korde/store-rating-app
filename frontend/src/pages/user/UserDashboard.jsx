import { useState, useEffect, useCallback } from 'react';
import { Search, Star as StarIcon, MapPin, Eye, Edit3, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserStores } from '../../api/stores.api';
import { useToast } from '../../components/ui/Toast';
import { StarRating, RatingDisplay } from '../../components/ui/StarRating';
import { Button } from '../../components/ui/Button';
import { getApiError, truncate, formatRating } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

const STORE_IMAGES = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1528698827591-e19cef51a699?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=600&h=300&fit=crop',
];

function getStoreImage(storeId, imageUrl) {
  if (imageUrl) return imageUrl;
  const hash = (storeId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return STORE_IMAGES[hash % STORE_IMAGES.length];
}

function StarRatingBar({ value, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-3 text-right">{value}</span>
      <StarIcon size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-4 text-right">{count}</span>
    </div>
  );
}

function StoreCard({ store, onNavigate }) {
  const img = getStoreImage(store.id, store.image_url);
  const avg = parseFloat(store.avg_rating) || 0;
  const hasRated = !!store.user_rating;

  return (
    <div
      onClick={() => onNavigate(store.id)}
      className="card overflow-hidden cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Store image */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        <img src={img} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {avg > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur rounded-full px-2.5 py-1 shadow-md">
            <StarIcon size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-slate-800">{avg.toFixed(1)}</span>
          </div>
        )}
        {hasRated && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500 text-white rounded-full px-2.5 py-1 shadow-md">
            <Edit3 size={10} />
            <span className="text-[10px] font-bold">Rated</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-heading font-bold text-white text-sm leading-tight drop-shadow-lg line-clamp-2">
            {store.name}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {store.address && (
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <MapPin size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
            <span className="line-clamp-2">{store.address}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Community Rating</p>
            {avg > 0 ? (
              <div className="flex items-center gap-1.5">
                <StarRating value={Math.round(avg)} size={14} />
                <span className="text-xs font-semibold text-slate-600">{avg.toFixed(1)}/5</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">No ratings yet</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Rating</p>
            {hasRated ? (
              <div className="flex items-center gap-1 justify-end">
                <StarRating value={store.user_rating} size={14} />
                <span className="text-xs font-semibold text-indigo-600">{store.user_rating}/5</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Not rated</span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 group-hover:gap-3 transition-all duration-200">
            <Eye size={14} />
            <span className="text-xs font-semibold">View Details & Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserDashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const dSearch = useDebounce(search, 300);

  const fetchStores = useCallback(() => {
    setLoading(true);
    const params = {};
    if (dSearch) { params.name = dSearch; params.address = dSearch; }
    getUserStores(params)
      .then((res) => setStores(res.data.data || []))
      .catch((err) => addToast({ message: getApiError(err), type: 'error' }))
      .finally(() => setLoading(false));
  }, [dSearch]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-800">Browse Stores</h2>
          <p className="text-slate-500 text-sm mt-0.5">Discover and rate local stores in your area</p>
        </div>
        {stores.length > 0 && (
          <span className="text-sm text-slate-400 font-medium">{stores.length} store{stores.length !== 1 ? 's' : ''} found</span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search stores by name or address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 shadow-sm transition-all placeholder-slate-300"
        />
      </div>

      {/* Store Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="skeleton h-44 rounded-none" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="card p-16 text-center">
          <Store size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="font-heading font-bold text-slate-600 text-lg mb-1">No stores found</h3>
          <p className="text-sm text-slate-400">
            {search ? `No results for "${search}"` : 'No stores available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} onNavigate={(id) => navigate(`/user/stores/${id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
