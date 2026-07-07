import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
              <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
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

          {/* Seed accounts tips */}
          <div class="mt-6 border-t border-slate-200 dark:border-slate-800/80 pt-6">
            <h4 class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mb-3">Seeded Demo Credentials:</h4>
            <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div class="bg-slate-100/60 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60">
                <p class="font-semibold text-slate-700 dark:text-slate-300">Super Admin:</p>
                <p>admin@hackathon.com</p>
                <p>admin123</p>
              </div>
              <div class="bg-slate-100/60 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60">
                <p class="font-semibold text-slate-700 dark:text-slate-300">Judge:</p>
                <p>judge@hackathon.com</p>
                <p>judge123</p>
              </div>
              <div class="bg-slate-100/60 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60">
                <p class="font-semibold text-slate-700 dark:text-slate-300">College rep:</p>
                <p>college@hackathon.com</p>
                <p>college123</p>
              </div>
              <div class="bg-slate-100/60 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60">
                <p class="font-semibold text-slate-700 dark:text-slate-300">Participant:</p>
                <p>student@hackathon.com</p>
                <p>student123</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
