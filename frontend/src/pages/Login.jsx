import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code, Mail, Lock, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password States
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess(response.data?.message || 'A password reset link has been sent to your email.');
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'No account found with this email.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Invalid email or password. Please try again.');
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
          Sign in to HackAI
        </h2>
        <p class="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Or{' '}
          <Link to="/register" class="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
            create a new participant account
          </Link>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div class="glass-card py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800">
          {error && (
            <div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2.5 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle class="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form class="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div class="mt-1.5 relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail class="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="block w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  placeholder="name@college.edu"
                />
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center">
                <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div class="mt-1.5 relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock class="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  class="block w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                class="w-full flex justify-center items-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all cursor-pointer group"
              >
                {isLoading ? (
                  <div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 relative overflow-hidden">
            {/* Decorative Blur Orb inside modal */}
            <div class="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-indigo-500/10 blur-[64px] pointer-events-none"></div>
            
            <div class="relative z-10">
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password?</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Enter your registered email address to check if a reset link can be sent to you.
              </p>

              {forgotError && (
                <div class="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2.5 text-rose-600 dark:text-rose-400 text-xs">
                  <AlertCircle class="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div class="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-2.5 text-emerald-600 dark:text-emerald-400 text-xs">
                  <CheckCircle class="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} class="space-y-4">
                <div>
                  <label for="forgot-email" class="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div class="mt-1.5 relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail class="h-4 w-4" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      class="block w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-xs"
                      placeholder="name@college.edu"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    class="w-full flex justify-center items-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all cursor-pointer"
                  >
                    {isForgotLoading ? (
                      <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotOpen(false);
                      setForgotEmail('');
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    class="w-full text-center py-2.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
