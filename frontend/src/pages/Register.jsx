import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Code, User as UserIcon, Mail, Lock, School, AlertCircle, ArrowLeft } from 'lucide-react';

const Register = () => {
  const { registerUser, login } = useAuth();
  const navigate = useNavigate();

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant'); // participant, college
  const [selectedCollegeId, setSelectedCollegeId] = useState('');

  // New College Inline Creation State (for College Reps or Participants whose college isn't listed)
  const [showNewCollegeForm, setShowNewCollegeForm] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeAddress, setNewCollegeAddress] = useState('');
  const [newCollegeContact, setNewCollegeContact] = useState('');

  const [colleges, setColleges] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load available colleges
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await api.get('/colleges');
        setColleges(response.data);
      } catch (err) {
        console.error('Failed to fetch colleges', err);
      }
    };
    fetchColleges();
  }, [showNewCollegeForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      let collegeId = selectedCollegeId;

      // If user wants to create a new college inline
      if (showNewCollegeForm || role === 'college') {
        if (!newCollegeName) {
          throw new Error('Please enter a college name.');
        }

        // Create the college first
        const collegeRes = await api.post('/colleges', {
          college_name: newCollegeName,
          address: newCollegeAddress,
          contact_person: newCollegeContact || name
        });

        collegeId = collegeRes.data.id;
      }

      // Register the User
      await registerUser(
        name,
        email,
        password,
        role,
        collegeId ? parseInt(collegeId) : null
      );

      setSuccess('Account created successfully! Logging you in...');

      // Auto Login
      setTimeout(async () => {
        try {
          await login(email, password);
          navigate('/');
        } catch (loginErr) {
          navigate('/login');
        }
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed. Please check inputs.');
      setIsLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-[128px] pointer-events-none"></div>
      <div class="absolute -bottom-45 -right-45 w-96 h-96 rounded-full bg-purple-500/10 blur-[128px] pointer-events-none"></div>

      <div class="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div class="flex justify-center">
          <Link to="/login" class="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-4 cursor-pointer">
            <ArrowLeft class="h-4 w-4 mr-1" /> Back to Sign In
          </Link>
        </div>
        <h2 class="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create an Account
        </h2>
        <p class="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" class="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div class="glass-card py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800">
          {error && (
            <div class="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2.5 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle class="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div class="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-2.5 text-emerald-600 dark:text-emerald-400 text-sm">
              <AlertCircle class="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form class="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Register as:
              </label>
              <div class="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setRole('participant'); setShowNewCollegeForm(false); }}
                  class={`py-2.5 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${role === 'participant'
                      ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border-indigo-500 shadow-inner'
                      : 'bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                  Participant
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('college'); setShowNewCollegeForm(true); }}
                  class={`py-2.5 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${role === 'college'
                      ? 'bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border-indigo-500 shadow-inner'
                      : 'bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                  College Representative
                </button>
              </div>
            </div>

            <div>
              <label for="name" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div class="mt-1.5 relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <UserIcon class="h-4.5 w-4.5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  class="block w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="block w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  placeholder="john.doe@gmail.com"
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  class="block w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* If Participant, show College selection */}
            {role === 'participant' && !showNewCollegeForm && (
              <div>
                <label for="college" class="block text-sm font-medium text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Select College</span>
                  <button
                    type="button"
                    onClick={() => setShowNewCollegeForm(true)}
                    class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Add new college?
                  </button>
                </label>
                <div class="mt-1.5 relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <School class="h-4.5 w-4.5" />
                  </div>
                  <select
                    id="college"
                    value={selectedCollegeId}
                    onChange={(e) => setSelectedCollegeId(e.target.value)}
                    required
                    class="block w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm appearance-none"
                  >
                    <option value="" class="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">Select your college</option>
                    {colleges.map((col) => (
                      <option key={col.id} value={col.id} class="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                        {col.college_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Inline College Creation form */}
            {showNewCollegeForm && (
              <div class="p-4 rounded-2xl bg-indigo-600/5 dark:bg-indigo-950/15 border border-indigo-500/15 space-y-4">
                <div class="flex justify-between items-center">
                  <h3 class="text-xs font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                    {role === 'college' ? 'College Organization Details' : 'Register New College'}
                  </h3>
                  {role === 'participant' && (
                    <button
                      type="button"
                      onClick={() => setShowNewCollegeForm(false)}
                      class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div>
                  <label for="college_name" class="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    College Name *
                  </label>
                  <input
                    id="college_name"
                    type="text"
                    required
                    value={newCollegeName}
                    onChange={(e) => setNewCollegeName(e.target.value)}
                    class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    placeholder="E.g., Stanford University"
                  />
                </div>

                <div>
                  <label for="college_address" class="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Address / Location
                  </label>
                  <input
                    id="college_address"
                    type="text"
                    value={newCollegeAddress}
                    onChange={(e) => setNewCollegeAddress(e.target.value)}
                    class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label for="college_contact" class="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Contact Person Name
                  </label>
                  <input
                    id="college_contact"
                    type="text"
                    value={newCollegeContact}
                    onChange={(e) => setNewCollegeContact(e.target.value)}
                    class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    placeholder="Dean / HOD Name (optional)"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                class="w-full flex justify-center items-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all cursor-pointer group"
              >
                {isLoading ? (
                  <div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
