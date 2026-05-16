import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, MapPin, Mail, User as UserIcon,
  MessageSquare, Share2, Check, ExternalLink,
  Send, Edit3, BarChart3, Store
} from 'lucide-react';
import { getStoreDetail, getUserStores } from '../../api/stores.api';
import { submitRating, updateRating } from '../../api/ratings.api';
import { StarRating } from '../../components/ui/StarRating';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { getApiError, formatDate } from '../../utils/formatters';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const STAR_COLORS = ['', 'text-red-500', 'text-orange-500', 'text-amber-500', 'text-lime-600', 'text-emerald-600'];

const STORE_IMAGES = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=500&fit=crop',
  'https://images.unsplash.com/photo-1528698827591-e19cef51a699?w=1200&h=500&fit=crop',
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&h=500&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=500&fit=crop',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&h=500&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=500&fit=crop',
  'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&h=500&fit=crop',
  'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1200&h=500&fit=crop',
];

function getStoreImage(storeId, imageUrl) {
  if (imageUrl) return imageUrl;
  const hash = (storeId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return STORE_IMAGES[hash % STORE_IMAGES.length];
}

export function UserStoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [detail, setDetail] = useState(null);
  const [userStore, setUserStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starValue, setStarValue] = useState(0);
  const [comment, setComment] = useState('');
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([getStoreDetail(id), getUserStores()])
      .then(([detailRes, storesRes]) => {
        const det = detailRes.data.data;
        setDetail(det);
        const userSpecific = (storesRes.data.data || []).find(s => s.id === id);
        setUserStore(userSpecific || null);
        if (userSpecific?.user_rating) {
          setStarValue(userSpecific.user_rating);
          setComment(userSpecific.user_comment || '');
          setShowRatingForm(false);
        } else {
          setShowRatingForm(true);
        }
      })
      .catch(err => setError(getApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  // Mapbox
  useEffect(() => {
    if (!detail?.address || !mapContainerRef.current || mapRef.current) return;
    const token = import.meta.env.VITE_MAP_TOKEN;
    if (!token || !window.mapboxgl) return;
    window.mapboxgl.accessToken = token;
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(detail.address)}.json?access_token=${token}&limit=1`)
      .then(r => r.json())
      .then(data => {
        const coords = data?.features?.[0]?.center;
        if (!coords || !mapContainerRef.current) return;
        const map = new window.mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: coords, zoom: 14,
        });
        map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
        new window.mapboxgl.Marker({ color: '#6366f1' })
          .setLngLat(coords)
          .setPopup(new window.mapboxgl.Popup().setHTML(`<strong>${detail.name}</strong><br/>${detail.address}`))
          .addTo(map);
        mapRef.current = map;
      }).catch(() => {});
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [detail]);

  const handleSubmitRating = async () => {
    if (!starValue) { addToast({ message: 'Please select a star rating.', type: 'error' }); return; }
    setSubmitting(true);
    try {
      if (userStore?.user_rating_id) {
        await updateRating(userStore.user_rating_id, { value: starValue, comment });
        addToast({ message: 'Your rating has been updated!', type: 'success' });
      } else {
        await submitRating({ storeId: id, value: starValue, comment });
        addToast({ message: 'Rating submitted! Thank you.', type: 'success' });
      }
      loadData();
      setShowRatingForm(false);
    } catch (err) {
      addToast({ message: getApiError(err), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: detail?.name, url: window.location.href }); } catch { }
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      setCopied(true); setTimeout(() => setCopied(false), 2500);
      addToast({ message: 'Link copied!', type: 'info' });
    }
  };

  const avgRating = parseFloat(detail?.avg_rating) || 0;
  const totalRatings = parseInt(detail?.total_ratings) || 0;
  const reviews = detail?.reviews || [];

  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.value === star).length;
    return { star, count, pct: totalRatings > 0 ? (count / totalRatings) * 100 : 0 };
  });

  if (loading) return (
    <div className="animate-slideUp space-y-6 max-w-5xl mx-auto">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-72 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  );

  if (error) return (
    <div className="card p-12 text-center max-w-md mx-auto">
      <Store size={40} className="text-slate-200 mx-auto mb-3" />
      <h3 className="font-bold text-slate-600 mb-1">Store Not Found</h3>
      <p className="text-sm text-slate-400 mb-4">{error}</p>
      <button onClick={() => navigate('/user/stores')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 mx-auto">
        <ArrowLeft size={16} /> Back to Stores
      </button>
    </div>
  );

  return (
    <div className="animate-slideUp space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/user/stores')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> All Stores
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-800 truncate max-w-xs">{detail?.name}</span>
      </div>

      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-lg">
        <img src={getStoreImage(detail?.id, detail?.image_url)} alt={detail?.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        {avgRating > 0 && (
          <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-white/95 backdrop-blur rounded-full px-3.5 py-1.5 shadow-lg">
            <Star size={15} className="text-amber-500 fill-amber-500" />
            <span className="text-sm font-bold text-slate-800">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-slate-500">({totalRatings} reviews)</span>
          </div>
        )}
        <button onClick={handleShare}
          className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/90 backdrop-blur text-slate-700 hover:bg-white rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-lg transition-all">
          {copied ? <><Check size={13} className="text-emerald-500" /> Copied!</> : <><Share2 size={13} /> Share</>}
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading drop-shadow-lg">{detail?.name}</h1>
          {detail?.address && (
            <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1.5"><MapPin size={13} /> {detail.address}</p>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info chips */}
          <div className="flex flex-wrap gap-2">
            {detail?.email && (
              <a href={`mailto:${detail.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:text-indigo-600 transition-colors shadow-sm">
                <Mail size={12} className="text-slate-400" />{detail.email}
              </a>
            )}
            {detail?.address && (
              <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(detail.address)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                <ExternalLink size={12} /> View on Map
              </a>
            )}
          </div>

          {/* Rating Summary */}
          <div className="card p-6">
            <h2 className="font-heading font-bold text-base text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-500" /> Community Ratings
            </h2>
            {avgRating > 0 ? (
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center justify-center px-6 py-4 bg-amber-50 rounded-2xl border border-amber-100 min-w-[140px]">
                  <p className="text-5xl font-bold text-slate-800 font-heading leading-none">{avgRating.toFixed(1)}</p>
                  <StarRating value={Math.round(avgRating)} size={20} className="mt-2" />
                  <p className="text-xs text-slate-400 mt-2 text-center">{totalRatings} rating{totalRatings !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1 space-y-2">
                  {distribution.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 w-3 text-right">{star}</span>
                      <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-5 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No ratings yet — be the first!</p>
            )}
          </div>

          {/* Your Rating Form */}
          <div className={`card p-5 ${showRatingForm ? 'ring-2 ring-indigo-200' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-base text-slate-800 flex items-center gap-2">
                <UserIcon size={17} className="text-indigo-500" /> Your Rating
              </h2>
              {userStore?.user_rating && !showRatingForm && (
                <button onClick={() => setShowRatingForm(true)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                  <Edit3 size={12} /> Edit Rating
                </button>
              )}
            </div>
            {userStore?.user_rating && !showRatingForm ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StarRating value={userStore.user_rating} size={24} />
                  <span className={`text-base font-bold ${STAR_COLORS[userStore.user_rating]}`}>
                    {STAR_LABELS[userStore.user_rating]} — {userStore.user_rating}/5
                  </span>
                </div>
                {userStore.user_comment && (
                  <div className="bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
                    <p className="text-sm text-slate-700 leading-relaxed italic">"{userStore.user_comment}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-3">Select your rating:</p>
                  <div className="flex items-center gap-3">
                    <StarRating value={starValue} interactive onChange={setStarValue} size={38} />
                    {starValue > 0 && (
                      <span className={`text-sm font-bold ${STAR_COLORS[starValue]}`}>{STAR_LABELS[starValue]}</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                    Write a review <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience with this store..."
                    rows={4} maxLength={500}
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none transition-all placeholder-slate-300"
                  />
                  <p className="text-right text-xs text-slate-400 mt-1">{comment.length}/500</p>
                </div>
                <div className="flex gap-3">
                  {userStore?.user_rating && (
                    <Button variant="ghost" size="sm" onClick={() => setShowRatingForm(false)}>Cancel</Button>
                  )}
                  <Button variant="primary" className="flex-1" disabled={!starValue || submitting} loading={submitting}
                    onClick={handleSubmitRating} id="store-detail-submit-rating">
                    <Send size={15} />
                    {userStore?.user_rating ? 'Update Rating' : 'Submit Rating'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Community Reviews */}
          <div>
            <h2 className="font-heading font-bold text-base text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare size={17} className="text-indigo-500" />
              Community Reviews
              <span className="ml-auto text-xs text-slate-400 font-normal">{reviews.length} total</span>
            </h2>
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reviews.map(review => (
                  <div key={review.id} className="card p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-600">{review.reviewer_name?.charAt(0)?.toUpperCase() || '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{review.reviewer_name}</p>
                            <p className="text-xs text-slate-400">{formatDate(review.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <StarRating value={review.value} size={13} />
                            <span className={`text-xs font-bold ${STAR_COLORS[review.value]}`}>{review.value}/5</span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 mt-2.5 leading-relaxed bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-10 text-center text-slate-400">
                <MessageSquare size={32} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm">No reviews yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-heading font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-500" /> Store Info
            </h3>
            <div className="divide-y divide-slate-100">
              {[
                { label: 'Total Reviews', value: totalRatings },
                { label: 'Avg Rating', value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5` : 'No ratings' },
                { label: 'Your Rating', value: userStore?.user_rating ? `${userStore.user_rating} / 5 ★` : 'Not rated yet' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <span className="text-xs font-semibold text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {detail?.address && (
            <div className="card p-4">
              <h3 className="font-heading font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-500" /> Location
              </h3>
              <div ref={mapContainerRef} className="w-full h-52 rounded-xl overflow-hidden bg-slate-100 border border-slate-200" />
              <p className="text-xs text-slate-400 mt-2 text-center">{detail.address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
