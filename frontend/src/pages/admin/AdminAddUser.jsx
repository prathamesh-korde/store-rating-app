import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, User, Mail, MapPin, Lock, UserPlus, ShieldCheck, Store, Users } from 'lucide-react';
import { createUser } from '../../api/users.api';
import { getAllStores } from '../../api/stores.api';
import { useToast } from '../../components/ui/Toast';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createUserSchema } from '../../utils/validators';
import { getApiError } from '../../utils/formatters';

const roleCards = [
  { value: 'admin', label: 'System Admin', icon: ShieldCheck, desc: 'Full platform access', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-300' },
  { value: 'user', label: 'Normal User', icon: Users, desc: 'Browse & rate stores', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-300' },
  { value: 'owner', label: 'Store Owner', icon: Store, desc: 'Manage a store', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300' },
];

export function AdminAddUser() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stores, setStores] = useState([]);
  const [selectedRoleCard, setSelectedRoleCard] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(createUserSchema),
  });

  const selectedRole = watch('role');

  useEffect(() => {
    getAllStores()
      .then((res) => setStores(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRoleCard(role);
    setValue('role', role, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      await createUser({ ...data, storeId: data.role === 'owner' ? data.storeId : undefined });
      addToast({ message: `User created successfully!`, type: 'success' });
      navigate('/admin/users');
    } catch (err) {
      addToast({ message: getApiError(err), type: 'error' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-slideUp">
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium mb-5 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Users
      </button>

      <div className="card overflow-hidden">
        {/* Card header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <UserPlus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">Add New User</h2>
              <p className="text-indigo-200 text-sm mt-0.5">Create an account for any platform role</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Role selection cards */}
          <div>
            <p className="form-label mb-3">Select Role <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-3 gap-3">
              {roleCards.map(({ value, label, icon: Icon, desc, color, bg, border }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRoleSelect(value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedRoleCard === value
                      ? `${bg} ${border}`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  id={`role-${value}`}
                >
                  <Icon size={20} className={`${color} mb-2`} />
                  <p className="text-sm font-bold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
            {errors.role && <p className="form-error">{errors.role.message}</p>}
            {/* Hidden input for form registration */}
            <input type="hidden" {...register('role')} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  id="user-name"
                  label="Full Name"
                  required
                  placeholder="Minimum 20 characters (e.g. John Michael Smith)"
                  icon={User}
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>
              <Input
                id="user-email"
                label="Email Address"
                type="email"
                required
                placeholder="user@example.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                id="user-password"
                label="Password"
                type="password"
                required
                placeholder="8–16 chars, uppercase & special"
                icon={Lock}
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="sm:col-span-2">
                <Input
                  id="user-address"
                  label="Address"
                  placeholder="Street address, City (optional)"
                  icon={MapPin}
                  error={errors.address?.message}
                  {...register('address')}
                />
              </div>
            </div>

            {/* Store assignment for owner role */}
            {selectedRole === 'owner' && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <Store size={14} /> Assign to Store (optional)
                </p>
                <Select
                  id="user-store"
                  error={errors.storeId?.message}
                  {...register('storeId')}
                >
                  <option value="">— Create without store assignment —</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
            )}

            {/* Password hint */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-xs text-slate-500">
                <span className="font-semibold">Password rules:</span> 8–16 characters · at least one uppercase letter · at least one special character (!@#$%^&*)
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => navigate('/admin/users')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting} className="flex-1" id="create-user-submit">
                <UserPlus size={16} />
                Create User
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
