import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Code, Lock, AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        new_password: password
      });
      setSuccess(response.data?.message || 'Password reset successfully. You can now login.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-[128px] pointer-events-none"></div>
      <div class="absolute -bottom-45 -right-45 w-96 h-96 rounded-full bg-purple-500/10 blur-[128px] pointer-events-none"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div class="flex justify-center">
          <div class="h-12 w-12 rounded-2xl animated-gradient flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <Code class="h-6.5 w-6.5 text-white" />
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Reset Your Password
        </h2>
        <p class="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Enter your new password below.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div class="glass-card py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800">
          
          {!token && (
            <div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2.5 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle class="h-5 w-5 shrink-0" />
              <span>Reset token is invalid or missing. Please request a new password reset link from the login page.</span>
            </div>
          )}

          {error && (
            <div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2.5 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle class="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-2.5 text-emerald-600 dark:text-emerald-400 text-sm">
              <CheckCircle class="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {success ? (
            <div class="mt-2">
              <Link
                to="/login"
                class="w-full flex justify-center items-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all cursor-pointer"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form class="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div class="mt-1.5 relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock class="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={!token || isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    class="block w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm disabled:opacity-50"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    disabled={!token || isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff class="h-4.5 w-4.5" />
                    ) : (
                      <Eye class="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label for="confirm-password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <div class="mt-1.5 relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock class="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    disabled={!token || isLoading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    class="block w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    disabled={!token || isLoading}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff class="h-4.5 w-4.5" />
                    ) : (
                      <Eye class="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!token || isLoading}
                  class="w-full flex justify-center items-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all cursor-pointer group"
                >
                  {isLoading ? (
                    <div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div class="mt-6 text-center">
            <Link to="/login" class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
