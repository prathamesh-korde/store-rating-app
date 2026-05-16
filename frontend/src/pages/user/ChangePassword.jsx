import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ShieldCheck } from 'lucide-react';
import { changePassword } from '../../api/auth.api';
import { useToast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { changePasswordSchema } from '../../utils/validators';
import { getApiError } from '../../utils/formatters';

export function ChangePassword() {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (data) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      addToast({ message: 'Password changed successfully!', type: 'success' });
      reset();
    } catch (err) {
      addToast({ message: getApiError(err), type: 'error' });
    }
  };

  return (
    <div className="max-w-md mx-auto animate-slideUp">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <ShieldCheck size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-800">Change Password</h2>
            <p className="text-sm text-slate-500">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input
            id="current-password"
            label="Current Password"
            type="password"
            required
            icon={Lock}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />

          <Input
            id="new-password"
            label="New Password"
            type="password"
            required
            placeholder="8-16 chars, 1 uppercase, 1 special char"
            icon={Lock}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />

          <Input
            id="confirm-password"
            label="Confirm New Password"
            type="password"
            required
            icon={Lock}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {/* Password rules reminder */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600 mb-1">Password requirements:</p>
            <p>• 8 to 16 characters</p>
            <p>• At least one uppercase letter (A–Z)</p>
            <p>• At least one special character (!@#$%^&*)</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="w-full"
            id="change-password-submit"
          >
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
