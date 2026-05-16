import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Mail, User, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import { getStoreDetail } from '../../api/stores.api';
import { useToast } from '../../components/ui/Toast';
import { getApiError, formatDate, formatRating } from '../../utils/formatters';
import { StarRating } from '../../components/ui/StarRating';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_TOKEN;

const STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1528698827591-e625c7e0f7b8?w=800&h=400&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop',
];

function RatingBar({ label, count, total, stars }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-8 text-right text-slate-500 font-medium">{stars}★</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-slate-400 text-xs">{count}</span>
    </div>
  );
}

export function AdminStoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getStoreDetail(id)
      .then(res => setStore(res.data.data))
      .catch(err => {
        addToast({ message: getApiError(err), type: 'error' });
        navigate('/admin/stores');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Initialize Mapbox
  useEffect(() => {
    if (!store?.address || !MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;
    if (!window.mapboxgl) return;

    const map = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [78.9629, 20.5937],
      zoom: 4,
      accessToken: MAPBOX_TOKEN,
    });
    map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    // Geocode the address
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(store.address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data.features?.length > 0) {
          const [lng, lat] = data.features[0].center;
          map.flyTo({ center: [lng, lat], zoom: 14 });
          new window.mapboxgl.Marker({ color: '#6366f1' })
            .setLngLat([lng, lat])
            .setPopup(new window.mapboxgl.Popup().setHTML(`<strong>${store.name}</strong><br/>${store.address}`))
            .addTo(map);
        }
      })
      .catch(() => {});

    return () => { map.remove(); mapRef.current = null; };
  }, [store]);

  if (loading) {
    return (
      <div className="space-y-6 animate-slideUp">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-64 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-6 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
          <div className="skeleton h-48" />
        </div>
      </div>
    );
  }

  if (!store) return null;

  const img = store.image_url || STOCK_IMAGES[0];
  const reviews = store.reviews || [];
  const ratingDist = [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    count: reviews.filter(r => r.value === s).length,
  }));

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-lg">
        <img src={img} alt={store.name} className="w-full h-full object-cover"
          onError={e => { e.target.src = STOCK_IMAGES[0]; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading leading-tight">{store.name}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            {store.address && (
              <span className="flex items-center gap-1.5 text-white/80 text-sm">
                <MapPin size={14} /> {store.address}
              </span>
            )}
            {store.avg_rating && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-bold">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                {formatRating(store.avg_rating)} ({store.total_ratings} ratings)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Store Details + Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Info */}
          <div className="card p-6">
            <h3 className="font-heading font-semibold text-slate-800 text-lg mb-4">Store Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Mail, label: 'Email', value: store.email },
                { icon: MapPin, label: 'Address', value: store.address || '—' },
                { icon: User, label: 'Owner', value: store.owner_name || 'Unassigned' },
                { icon: Calendar, label: 'Added', value: formatDate(store.created_at) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p className="text-sm text-slate-800 font-medium mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Reviews */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-indigo-500" />
              <h3 className="font-heading font-semibold text-slate-800 text-lg">
                Community Reviews ({reviews.length})
              </h3>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">
                            {review.reviewer_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{review.reviewer_name}</p>
                          <p className="text-[10px] text-slate-400">{formatDate(review.created_at)}</p>
                        </div>
                      </div>
                      <StarRating value={review.value} size={14} />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-600 leading-relaxed mt-2 pl-9">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">No reviews yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Rating Distribution + Map */}
        <div className="space-y-6">
          {/* Rating Distribution */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-amber-500" />
              <h3 className="font-heading font-semibold text-slate-800">Rating Distribution</h3>
            </div>
            <div className="text-center mb-5">
              <p className="text-4xl font-bold font-heading text-slate-800">
                {store.avg_rating ? formatRating(store.avg_rating) : '—'}
              </p>
              {store.avg_rating && (
                <StarRating value={Math.round(Number(store.avg_rating))} size={20} className="justify-center mt-1" />
              )}
              <p className="text-xs text-slate-400 mt-1">{store.total_ratings || 0} total ratings</p>
            </div>
            <div className="space-y-2">
              {ratingDist.map(({ stars, count }) => (
                <RatingBar key={stars} stars={stars} count={count} total={reviews.length} />
              ))}
            </div>
          </div>

          {/* Map */}
          {store.address && MAPBOX_TOKEN && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="font-heading font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <MapPin size={14} className="text-indigo-500" /> Location
                </h3>
              </div>
              <div ref={mapContainerRef} className="h-64 w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
