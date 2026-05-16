import { useState, useEffect } from 'react';
import { Star, Users, TrendingUp } from 'lucide-react';
import { getOwnerDashboard } from '../../api/ratings.api';
import { useToast } from '../../components/ui/Toast';
import { Table } from '../../components/ui/Table';
import { StarRating } from '../../components/ui/StarRating';
import { formatDate, getApiError } from '../../utils/formatters';

export function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ sortBy: 'created_at', sortDir: 'DESC' });
  const { addToast } = useToast();

  useEffect(() => {
    getOwnerDashboard()
      .then((res) => setData(res.data.data))
      .catch((err) => addToast({ message: getApiError(err), type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const sortedRaters = data?.raters
    ? [...data.raters].sort((a, b) => {
      const aVal = sort.sortBy === 'value' ? a.value : new Date(a.created_at);
      const bVal = sort.sortBy === 'value' ? b.value : new Date(b.created_at);
      return sort.sortDir === 'ASC' ? aVal - bVal : bVal - aVal;
    })
    : [];

  const columns = [
    { key: 'user_name', label: 'Customer Name', sortable: false },
    { key: 'user_email', label: 'Email', sortable: false },
    {
      key: 'value',
      label: 'Rating',
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-2">
          <StarRating value={val} size={14} />
          <span className="text-sm font-semibold text-slate-700">{val}/5</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (val) => formatDate(val),
    },
  ];

  return (
    <div className="space-y-8 animate-slideUp">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-800">Store Dashboard</h2>
        {data?.store && (
          <p className="text-slate-500 text-sm mt-0.5">{data.store.name}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Average Rating */}
        <div className="stat-card col-span-1 sm:col-span-2">
          <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Star size={26} className="text-amber-500 fill-amber-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Average Rating</p>
            {loading ? (
              <div className="skeleton h-10 w-24 mt-1" />
            ) : data?.avgRating ? (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-heading text-slate-800">
                  {Number(data.avgRating).toFixed(1)}
                </span>
                <span className="text-slate-400 text-lg">/5</span>
              </div>
            ) : (
              <p className="text-lg text-slate-400 mt-1">No ratings yet</p>
            )}
            {data?.avgRating && (
              <StarRating value={Math.round(Number(data.avgRating))} size={18} className="mt-1" />
            )}
          </div>
        </div>

        {/* Total Raters */}
        <div className="stat-card">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Users size={22} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Ratings</p>
            {loading ? (
              <div className="skeleton h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold font-heading text-slate-800">
                {data?.raters?.length ?? 0}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Raters Table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-indigo-500" />
          <h3 className="font-heading text-lg font-semibold text-slate-700">Customer Ratings</h3>
        </div>
        <Table
          columns={columns}
          data={sortedRaters}
          onSort={(key, dir) => setSort({ sortBy: key, sortDir: dir })}
          sortBy={sort.sortBy}
          sortDir={sort.sortDir}
          loading={loading}
          emptyMessage="No ratings have been submitted for your store yet."
        />
      </div>
    </div>
  );
}
