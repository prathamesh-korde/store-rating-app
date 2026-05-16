import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import { getUsers, getUserById } from '../../api/users.api';
import { useToast } from '../../components/ui/Toast';
import { Table, Pagination } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Input';
import { RatingDisplay } from '../../components/ui/StarRating';
import { formatDate, getApiError } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

const ROLES = ['', 'admin', 'user', 'owner'];

export function AdminUsers() {
  const [data, setData] = useState({ users: [], total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sort, setSort] = useState({ sortBy: 'created_at', sortDir: 'DESC' });
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const { addToast } = useToast();

  const debouncedSearch = useDebounce(search);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    getUsers({
      name: debouncedSearch || undefined,
      email: debouncedSearch || undefined,
      address: debouncedSearch || undefined,
      role: roleFilter || undefined,
      ...sort,
      page,
      limit: 10,
    })
      .then((res) => setData(res.data.data))
      .catch((err) => addToast({ message: getApiError(err), type: 'error' }))
      .finally(() => setLoading(false));
  }, [debouncedSearch, roleFilter, sort, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSort = (key, dir) => {
    setSort({ sortBy: key, sortDir: dir });
    setPage(1);
  };

  const openUserModal = async (userId) => {
    setModalLoading(true);
    setSelectedUser({});
    try {
      const res = await getUserById(userId);
      setSelectedUser(res.data.data);
    } catch (err) {
      addToast({ message: getApiError(err), type: 'error' });
      setSelectedUser(null);
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    { key: 'role', label: 'Role', sortable: true, render: (val) => <Badge role={val} /> },
    { key: 'created_at', label: 'Joined', sortable: true, render: (val) => formatDate(val) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => openUserModal(row.id)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          aria-label={`View details for ${row.name}`}
        >
          <Eye size={14} />
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-800">Users</h2>
          <p className="text-slate-500 text-sm mt-0.5">{data.total} total users</p>
        </div>
        <Link to="/admin/users/new">
          <Button variant="primary" id="add-user-btn">
            <Plus size={16} />
            Add User
          </Button>
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="input-group flex-1">
            <span className="input-icon-box" aria-hidden="true"><Search size={16} /></span>
            <input
              id="user-search"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, or address..."
              className="form-input input-with-icon"
            />
          </div>
          <Select
            id="filter-role"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="sm:w-40"
          >
            <option value="">All Roles</option>
            {ROLES.filter(Boolean).map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={data.users}
        onSort={handleSort}
        sortBy={sort.sortBy}
        sortDir={sort.sortDir}
        loading={loading}
        emptyMessage="No users found matching the filters."
      />

      <Pagination
        page={page}
        total={data.total}
        limit={data.limit}
        onPageChange={setPage}
      />

      {/* User Detail Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
      >
        {modalLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-5 w-full" />)}
          </div>
        ) : selectedUser && Object.keys(selectedUser).length > 0 ? (
          <div className="space-y-4">
            {[
              { label: 'Name', value: selectedUser.name },
              { label: 'Email', value: selectedUser.email },
              { label: 'Address', value: selectedUser.address || '—' },
              { label: 'Role', value: <Badge role={selectedUser.role} /> },
              { label: 'Member Since', value: formatDate(selectedUser.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start border-b border-slate-100 pb-3">
                <span className="text-sm font-semibold text-slate-500">{label}</span>
                <span className="text-sm text-slate-800 text-right max-w-[60%]">{value}</span>
              </div>
            ))}
            {selectedUser.role === 'owner' && (
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-sm font-semibold text-slate-500">Store Avg Rating</span>
                {selectedUser.avg_store_rating ? (
                  <RatingDisplay value={selectedUser.avg_store_rating} />
                ) : (
                  <span className="text-sm text-slate-400">No ratings yet</span>
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
