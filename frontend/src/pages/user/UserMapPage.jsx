import { useEffect, useRef, useState, useCallback } from 'react';
import { getUserStores } from '../../api/stores.api';
import { MapPin, Star, Loader2, Search, ExternalLink, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_TOKEN;

const STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&h=180&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=180&fit=crop',
  'https://images.unsplash.com/photo-1528698827591-e625c7e0f7b8?w=300&h=180&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=180&fit=crop',
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&h=180&fit=crop',
  'https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=300&h=180&fit=crop',
];

function ratingColor(avg) {
  const v = parseFloat(avg) || 0;
  if (v >= 4) return '#10b981';
  if (v >= 3) return '#f59e0b';
  return '#6366f1';
}

function StoreListItem({ store, index, isSelected, onClick, onView }) {
  const avg = parseFloat(store.avg_rating) || 0;
  const img = store.image_url || STOCK_IMAGES[index % STOCK_IMAGES.length];

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-indigo-50 border-indigo-200 shadow-sm'
          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
      }`}
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={img}
          alt={store.name}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = STOCK_IMAGES[0]; }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-1">
          {store.name}
        </p>
        {store.address && (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 line-clamp-1">
            <MapPin size={10} className="flex-shrink-0" />
            {store.address}
          </p>
        )}
        <div className="flex items-center justify-between mt-1.5">
          {avg > 0 ? (
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: ratingColor(avg) }}>
              <Star size={11} className="fill-current" />
              {avg.toFixed(1)}
            </span>
          ) : (
            <span className="text-xs text-slate-400">No ratings</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 transition-colors"
            aria-label={`View details for ${store.name}`}
          >
            View <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserMapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(search, 300);

  // Fetch stores
  useEffect(() => {
    getUserStores()
      .then(res => {
        const data = res.data.data || [];
        setStores(data);
        setFilteredStores(data);
      })
      .catch(() => setError('Failed to load stores. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  // Filter stores by search
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setFilteredStores(stores);
    } else {
      const q = debouncedSearch.toLowerCase();
      setFilteredStores(
        stores.filter(s =>
          s.name?.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q)
        )
      );
    }
  }, [debouncedSearch, stores]);

  // Initialize Mapbox
  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return;
    if (!MAPBOX_TOKEN || !window.mapboxgl) {
      setError('Map is unavailable. Missing Mapbox configuration.');
      return;
    }

    window.mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [78.9629, 20.5937],
      zoom: 4,
    });
    map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      stores.forEach((store, index) => {
        if (!store.address) return;
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(store.address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`)
          .then(r => r.json())
          .then(data => {
            const coords = data?.features?.[0]?.center;
            if (!coords) return;

            const avg = parseFloat(store.avg_rating) || 0;
            const popup = new window.mapboxgl.Popup({ offset: 25, maxWidth: '260px' }).setHTML(`
              <div style="font-family: 'DM Sans', sans-serif; padding: 4px; min-width: 200px;">
                <p style="font-weight: 700; font-size: 14px; margin: 0 0 4px; color: #1e293b;">${store.name}</p>
                ${store.address ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 6px;">${store.address}</p>` : ''}
                ${avg > 0
                  ? `<p style="font-size: 13px; color: #f59e0b; font-weight: 600; margin: 0 0 8px;">★ ${avg.toFixed(1)} / 5</p>`
                  : '<p style="font-size:12px;color:#94a3b8;margin: 0 0 8px;">No ratings yet</p>'
                }
                <button onclick="window.location.href='/user/stores/${store.id}'" 
                  style="background:#6366f1; color:white; border:none; border-radius:8px; padding:6px 14px; font-size:12px; cursor:pointer; font-weight:600; width:100%;">
                  View Details →
                </button>
              </div>
            `);

            const marker = new window.mapboxgl.Marker({ color: ratingColor(avg) })
              .setLngLat(coords)
              .setPopup(popup)
              .addTo(map);

            markersRef.current[store.id] = { marker, coords };

            marker.getElement().addEventListener('click', () => {
              setSelectedStoreId(store.id);
            });
          }).catch(() => {});
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = {};
    };
  }, [loading, stores]);

  // Navigate map to selected store
  const flyToStore = useCallback((storeId) => {
    setSelectedStoreId(storeId);
    const entry = markersRef.current[storeId];
    if (entry && mapRef.current) {
      mapRef.current.flyTo({ center: entry.coords, zoom: 15, duration: 1000 });
      entry.marker.togglePopup();
    }
  }, []);

  return (
    <div className="animate-slideUp space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-800">Store Map</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Explore stores near you — click a store to locate it on the map
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 4–5★</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 3–4★</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Below 3★</span>
          </div>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 bg-indigo-50 px-3 py-2 rounded-xl transition-colors"
          >
            {sidebarOpen ? 'Hide' : 'Show'} List ({stores.length})
          </button>
        </div>
      </div>

      {/* Map + Sidebar Layout */}
      {loading ? (
        <div className="card flex items-center justify-center" style={{ height: '560px' }}>
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading stores & map...</p>
          </div>
        </div>
      ) : error ? (
        <div className="card flex items-center justify-center" style={{ height: '560px' }}>
          <div className="text-center">
            <MapPin size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-4" style={{ height: '560px' }}>
          {/* Store List Sidebar */}
          {sidebarOpen && (
            <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col card overflow-hidden hidden sm:flex">
              {/* Search */}
              <div className="p-3 border-b border-slate-100 flex-shrink-0">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search stores..."
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2 px-1">
                  {filteredStores.length} of {stores.length} stores
                </p>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredStores.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No stores match your search</p>
                  </div>
                ) : (
                  filteredStores.map((store, i) => (
                    <StoreListItem
                      key={store.id}
                      store={store}
                      index={i}
                      isSelected={selectedStoreId === store.id}
                      onClick={() => flyToStore(store.id)}
                      onView={() => navigate(`/user/stores/${store.id}`)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Mobile: bottom sheet hint */}
            <div className="absolute bottom-4 left-4 right-4 sm:hidden">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-slate-200">
                <p className="text-xs text-slate-600 font-medium text-center">
                  {stores.length} stores — tap a pin to see details
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile store list (below map on small screens) */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-slate-700 text-sm">{stores.length} Stores</p>
        </div>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stores..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
          />
        </div>
        <div className="space-y-2">
          {filteredStores.map((store, i) => (
            <StoreListItem
              key={store.id}
              store={store}
              index={i}
              isSelected={selectedStoreId === store.id}
              onClick={() => flyToStore(store.id)}
              onView={() => navigate(`/user/stores/${store.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
