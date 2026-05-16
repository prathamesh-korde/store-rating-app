import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Star, MapPin, MessageSquare } from 'lucide-react';
import { getAdminStores, createStore } from '../../api/stores.api';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStoreSchema } from '../../utils/validators';
import { getApiError, formatRating } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { getUsers } from '../../api/users.api';
import { Pagination } from '../../components/ui/Table';

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

export function AdminStores() {
  const [data, setData] = useState({ stores: [], total: 0, page: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [owners, setOwners] = useState([]);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const debouncedSearch = useDebounce(search);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createStoreSchema) });

  const fetchStores = useCallback(() => {
    setLoading(true);
    getAdminStores({
      search: debouncedSearch || undefined,
      page,
      limit: 12,
    })
      .then((res) => setData(res.data.data))
      .catch((err) => addToast({ message: getApiError(err), type: 'error' }))
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  useEffect(() => {
    getUsers({ role: 'owner', limit: 100 })
      .then((res) => setOwners(res.data.data.users || []))
      .catch(() => { });
  }, []);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const onCreateStore = async (formData) => {
    try {
      await createStore({ ...formData, ownerId: formData.ownerId || undefined });
      addToast({ message: 'Store created successfully!', type: 'success' });
      setShowModal(false);
      reset();
      fetchStores();
    } catch (err) {
      addToast({ message: getApiError(err), type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-800">Stores</h2>
          <p className="text-slate-500 text-sm mt-0.5">{data.total} total stores</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} id="add-store-btn">
          <Plus size={16} />
          Add Store
        </Button>
      </div>

      <div className="card p-4">
        <div className="input-group">
          <span className="input-icon-box" aria-hidden="true"><Search size={16} /></span>
          <input
            id="store-search"
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by store name, email, or address..."
            className="form-input input-with-icon"
          />
        </div>
      </div>

      {/* Store Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton h-40" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : data.stores.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.stores.map((store, i) => {
            const img = store.image_url || STOCK_IMAGES[i % STOCK_IMAGES.length];
            return (
              <div
                key={store.id}
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
                    <span className="text-xs text-slate-500">{store.owner_name || 'Unassigned'}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MessageSquare size={11} />
                      {store.total_ratings || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Store size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No stores found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search</p>
        </div>
      )}

      <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />

      {/* Create Store Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset(); }} title="Add New Store">
        <form onSubmit={handleSubmit(onCreateStore)} noValidate className="space-y-4">
          <Input
            id="store-name"
            label="Store Name"
            required
            placeholder="Minimum 20 characters"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            id="store-email"
            label="Store Email"
            type="email"
            required
            placeholder="store@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            id="store-address"
            label="Address"
            placeholder="Store address"
            error={errors.address?.message}
            {...register('address')}
          />
          <Input
            id="store-image"
            label="Image URL (optional)"
            placeholder="https://example.com/store-photo.jpg"
            error={errors.image_url?.message}
            {...register('image_url')}
          />
          <Select
            id="store-owner"
            label="Assign Owner (optional)"
            error={errors.ownerId?.message}
            {...register('ownerId')}
          >
            <option value="">— No owner —</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => { setShowModal(false); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting} className="flex-1" id="create-store-submit">
              Create Store
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
