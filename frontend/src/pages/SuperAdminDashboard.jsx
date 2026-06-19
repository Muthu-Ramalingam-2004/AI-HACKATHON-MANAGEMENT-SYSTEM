import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api, { API_URL } from '../utils/api';
import { 
  Users, 
  School, 
  Code, 
  Trophy, 
  Plus, 
  Trash2, 
  Edit, 
  Award, 
  AlertCircle, 
  CheckCircle,
  FileText
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview'); // overview, hackathons, colleges, users, certificates
  
  // Dashboard stats
  const [stats, setStats] = useState({ users: 0, colleges: 0, hackathons: 0, teams: 0, submissions: 0 });
  const [roleDist, setRoleDist] = useState({});
  
  // Lists
  const [hackathons, setHackathons] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [certificates, setCertificates] = useState([]);

  // Create Hackathon form state
  const [hackTitle, setHackTitle] = useState('');
  const [hackDesc, setHackDesc] = useState('');
  const [hackStart, setHackStart] = useState('');
  const [hackEnd, setHackEnd] = useState('');
  const [editingHackId, setEditingHackId] = useState(null);

  // Generate Certificate form state
  const [certUserId, setCertUserId] = useState('');
  const [certType, setCertType] = useState('participation');
  const [certHackId, setCertHackId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Overview stats
      const statsRes = await api.get('/dashboard/admin');
      setStats(statsRes.data.stats);
      setRoleDist(statsRes.data.role_distribution);

      // 2. Fetch Hackathons
      const hackRes = await api.get('/hackathons');
      setHackathons(hackRes.data);

      // 3. Fetch Colleges
      const colRes = await api.get('/colleges');
      setColleges(colRes.data);

      // 4. Fetch Users dynamically from auth/users
      try {
        const usersRes = await api.get('/auth/users');
        const formattedUsers = usersRes.data.map(u => ({
          ...u,
          college_name: u.college ? u.college.college_name : 'System Organizer'
        }));
        setUsersList(formattedUsers);
      } catch (userErr) {
        console.error('Failed to fetch users, falling back to mock', userErr);
        setUsersList([
          { id: 4, name: 'Jane Doe', email: 'student@hackathon.com', role: 'participant', college_name: 'Global Institute of Technology' },
          { id: 2, name: 'Expert Judge', email: 'judge@hackathon.com', role: 'judge', college_name: 'External Evaluator' },
          { id: 3, name: 'College Coordinator', email: 'college@hackathon.com', role: 'college', college_name: 'Global Institute of Technology' }
        ]);
      }

      // 5. Fetch certificates
      const certRes = await api.get('/certificates/all');
      setCertificates(certRes.data);

    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith('/hackathons')) {
      setActiveTab('hackathons');
    } else if (path.endsWith('/colleges')) {
      setActiveTab('colleges');
    } else if (path.endsWith('/users')) {
      setActiveTab('users');
    } else if (path.endsWith('/certificates')) {
      setActiveTab('certificates');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleHackathonSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHackId) {
        await api.put(`/hackathons/${editingHackId}`, {
          title: hackTitle,
          description: hackDesc,
          start_date: hackStart,
          end_date: hackEnd
        });
        showMessage('success', 'Hackathon updated successfully!');
      } else {
        await api.post('/hackathons/', {
          title: hackTitle,
          description: hackDesc,
          start_date: hackStart,
          end_date: hackEnd,
          status: 'draft'
        });
        showMessage('success', 'Hackathon created successfully! Status is draft.');
      }
      setHackTitle('');
      setHackDesc('');
      setHackStart('');
      setHackEnd('');
      setEditingHackId(null);
      loadData();
    } catch (err) {
      showMessage('error', 'Failed to save hackathon');
    }
  };

  const handlePublishHackathon = async (id) => {
    try {
      await api.post(`/hackathons/${id}/publish`);
      showMessage('success', 'Hackathon published successfully! Registration is now open.');
      loadData();
    } catch (err) {
      showMessage('error', 'Failed to publish hackathon');
    }
  };

  const handleDeleteHackathon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hackathon?')) return;
    try {
      await api.delete(`/hackathons/${id}`);
      showMessage('success', 'Hackathon deleted successfully');
      loadData();
    } catch (err) {
      showMessage('error', 'Failed to delete hackathon');
    }
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!certUserId || !certHackId || !certType) return;
    try {
      await api.post(`/certificates/generate?user_id=${certUserId}&cert_type=${certType}&hackathon_id=${certHackId}`);
      showMessage('success', 'Certificate generated successfully!');
      setCertUserId('');
      setCertHackId('');
      loadData();
    } catch (err) {
      showMessage('error', err.response?.data?.detail || 'Failed to generate certificate');
    }
  };

  return (
    <div class="space-y-6">
      {/* Messages */}
      {msg.text && (
        <div class={`p-4 rounded-xl border flex items-center space-x-2.5 text-sm ${
          msg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {msg.type === 'success' ? <CheckCircle class="h-5 w-5 shrink-0" /> : <AlertCircle class="h-5 w-5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div class="flex border-b border-slate-800 space-x-6 text-sm">
        {['overview', 'hackathons', 'colleges', 'users', 'certificates'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              if (tab === 'overview') {
                navigate('/dashboard/admin');
              } else {
                navigate(`/dashboard/admin/${tab}`);
              }
            }}
            class={`pb-3 font-semibold transition-all capitalize border-b-2 cursor-pointer ${
              activeTab === tab 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div class="space-y-6">
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Users', val: stats.users, icon: Users },
              { label: 'Colleges', val: stats.colleges, icon: School },
              { label: 'Hackathons', val: stats.hackathons, icon: Code },
              { label: 'Teams', val: stats.teams, icon: Trophy },
              { label: 'Submissions', val: stats.submissions, icon: FileText }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} class="glass-card p-5 rounded-2xl border border-slate-800 text-center flex flex-col items-center">
                  <div class="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                    <Icon class="h-4.5 w-4.5" />
                  </div>
                  <span class="text-[10px] text-slate-500 font-semibold uppercase block">{card.label}</span>
                  <span class="text-xl font-extrabold text-white mt-1 block">{card.val}</span>
                </div>
              );
            })}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Roles Card */}
            <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 class="font-bold text-white text-base">User Roles Distribution</h3>
              <div class="divide-y divide-slate-800/60">
                {Object.entries(roleDist).map(([role, count]) => (
                  <div key={role} class="py-2.5 flex justify-between items-center text-sm">
                    <span class="capitalize text-slate-400 font-medium">{role}s</span>
                    <span class="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-mono text-xs">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 class="font-bold text-white text-base">Quick Admin Commands</h3>
              <div class="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setActiveTab('hackathons')} 
                  class="p-3 text-center rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Configure Hackathon
                </button>
                <button 
                  onClick={() => setActiveTab('certificates')} 
                  class="p-3 text-center rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Issue Winner Cert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HACKATHONS TAB (CRUD) */}
      {activeTab === 'hackathons' && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hackathons management list */}
          <div class="lg:col-span-2 space-y-4">
            <h3 class="text-lg font-bold text-white">Hackathon Configurations</h3>
            <div class="space-y-4">
              {hackathons.map((h) => (
                <div key={h.id} class="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h4 class="font-bold text-white text-base">{h.title}</h4>
                    <p class="text-xs text-slate-500 mt-1">
                      {new Date(h.start_date).toLocaleDateString()} - {new Date(h.end_date).toLocaleDateString()}
                    </p>
                    <p class="text-xs text-slate-400 mt-2 line-clamp-2">{h.description}</p>
                  </div>
                  <div class="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    {h.status === 'draft' && (
                      <button
                        onClick={() => handlePublishHackathon(h.id)}
                        class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/10"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingHackId(h.id);
                        setHackTitle(h.title);
                        setHackDesc(h.description || '');
                        setHackStart(h.start_date.substring(0, 16));
                        setHackEnd(h.end_date.substring(0, 16));
                      }}
                      class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHackathon(h.id)}
                      class="p-2 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/10 hover:border-rose-500/25 rounded-lg cursor-pointer"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hackathon Add/Edit Form */}
          <div class="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 class="text-base font-bold text-white mb-4">
              {editingHackId ? 'Update Hackathon Details' : 'Create New Hackathon'}
            </h3>
            <form onSubmit={handleHackathonSubmit} class="space-y-4">
              <div>
                <label for="hack_title" class="block text-xs font-medium text-slate-300">
                  Hackathon Title *
                </label>
                <input
                  id="hack_title"
                  type="text"
                  required
                  value={hackTitle}
                  onChange={(e) => setHackTitle(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
                  placeholder="AI Innovation Hack"
                />
              </div>

              <div>
                <label for="hack_desc" class="block text-xs font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  id="hack_desc"
                  rows="3"
                  value={hackDesc}
                  onChange={(e) => setHackDesc(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
                  placeholder="Brief agenda and themes..."
                />
              </div>

              <div>
                <label for="hack_start" class="block text-xs font-medium text-slate-300">
                  Start Date *
                </label>
                <input
                  id="hack_start"
                  type="datetime-local"
                  required
                  value={hackStart}
                  onChange={(e) => setHackStart(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
                />
              </div>

              <div>
                <label for="hack_end" class="block text-xs font-medium text-slate-300">
                  End Date *
                </label>
                <input
                  id="hack_end"
                  type="datetime-local"
                  required
                  value={hackEnd}
                  onChange={(e) => setHackEnd(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
                />
              </div>

              <div class="flex space-x-2 pt-2">
                <button
                  type="submit"
                  class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg cursor-pointer"
                >
                  {editingHackId ? 'Update Hackathon' : 'Create Hackathon'}
                </button>
                {editingHackId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHackId(null);
                      setHackTitle('');
                      setHackDesc('');
                      setHackStart('');
                      setHackEnd('');
                    }}
                    class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLEGES TAB */}
      {activeTab === 'colleges' && (
        <div class="glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div class="p-6 border-b border-slate-800">
            <h3 class="font-bold text-white text-base">Affiliated Colleges List</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Institutes registered under HackAI platform.</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-900/50 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                  <th class="px-6 py-4">College Name</th>
                  <th class="px-6 py-4">Address / Location</th>
                  <th class="px-6 py-4">Representative / Contact</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-sm text-slate-300">
                {colleges.map((c) => (
                  <tr key={c.id} class="hover:bg-slate-800/10">
                    <td class="px-6 py-4 font-bold text-white">{c.college_name}</td>
                    <td class="px-6 py-4 text-xs text-slate-400">{c.address || 'N/A'}</td>
                    <td class="px-6 py-4 text-xs text-slate-400">{c.contact_person || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div class="glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div class="p-6 border-b border-slate-800">
            <h3 class="font-bold text-white text-base">Users Roster</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Monitor system administrators, judges, coordinators, and students.</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-900/50 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                  <th class="px-6 py-4">Name</th>
                  <th class="px-6 py-4">Email</th>
                  <th class="px-6 py-4">Role</th>
                  <th class="px-6 py-4">Institution</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-sm text-slate-300">
                {usersList.map((usr) => (
                  <tr key={usr.id} class="hover:bg-slate-800/10">
                    <td class="px-6 py-4 font-bold text-white">{usr.name}</td>
                    <td class="px-6 py-4 text-xs font-mono text-slate-400">{usr.email}</td>
                    <td class="px-6 py-4">
                      <span class={`px-2 py-0.5 text-[10px] font-bold rounded-lg border uppercase ${
                        usr.role === 'admin' 
                          ? 'bg-rose-500/10 border-rose-500/15 text-rose-400'
                          : usr.role === 'judge'
                          ? 'bg-amber-500/10 border-amber-500/15 text-amber-400'
                          : usr.role === 'college'
                          ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400'
                          : 'bg-indigo-500/10 border-indigo-500/15 text-indigo-400'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-400">{usr.college_name || 'System Organizer'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CERTIFICATES TAB */}
      {activeTab === 'certificates' && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Certificate listing */}
          <div class="lg:col-span-2 space-y-4">
            <h3 class="text-lg font-bold text-white">Issued Certificates</h3>
            <div class="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-900/50 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                      <th class="px-6 py-4">User</th>
                      <th class="px-6 py-4">Type</th>
                      <th class="px-6 py-4">Certificate Number</th>
                      <th class="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60 text-sm text-slate-300">
                    {certificates.map((cert) => (
                      <tr key={cert.id} class="hover:bg-slate-800/10">
                        <td class="px-6 py-4 font-semibold text-white">{cert.user.name}</td>
                        <td class="px-6 py-4">
                          <span class="capitalize text-xs font-medium text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                            {cert.certificate_type}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-xs font-mono text-slate-400">{cert.certificate_number}</td>
                        <td class="px-6 py-4 text-right">
                          <a
                            href={`${API_URL}/certificates/${cert.id}/download?token=${localStorage.getItem('accessToken')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
                          >
                            PDF <FileText class="h-3.5 w-3.5 ml-1" />
                          </a>
                        </td>
                      </tr>
                    ))}
                    {certificates.length === 0 && (
                      <tr>
                        <td colSpan="4" class="px-6 py-8 text-center text-slate-500 text-xs">No certificates generated yet. Use form to generate one.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Certificate Generation form */}
          <div class="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 class="text-base font-bold text-white mb-4">Issue Digital Certificate</h3>
            <form onSubmit={handleGenerateCertificate} class="space-y-4">
              <div>
                <label for="cert_recipient" class="block text-xs font-medium text-slate-300">
                  Select Recipient *
                </label>
                <select
                  id="cert_recipient"
                  required
                  value={certUserId}
                  onChange={(e) => setCertUserId(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 appearance-none"
                >
                  <option value="">Select student...</option>
                  {usersList.filter(u => u.role === 'participant').map(usr => (
                    <option key={usr.id} value={usr.id}>{usr.name} ({usr.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label for="cert_hackathon" class="block text-xs font-medium text-slate-300">
                  Associated Hackathon *
                </label>
                <select
                  id="cert_hackathon"
                  required
                  value={certHackId}
                  onChange={(e) => setCertHackId(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 appearance-none"
                >
                  <option value="">Select hackathon...</option>
                  {hackathons.map((h) => (
                    <option key={h.id} value={h.id}>{h.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-300">
                  Certificate Class *
                </label>
                <div class="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCertType('participation')}
                    class={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      certType === 'participation'
                        ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800'
                    }`}
                  >
                    Participation
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertType('winner')}
                    class={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      certType === 'winner'
                        ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800'
                    }`}
                  >
                    Winner Certificate
                  </button>
                </div>
              </div>

              <button
                type="submit"
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 cursor-pointer flex items-center justify-center"
              >
                <Award class="h-4 w-4 mr-1.5 shrink-0" />
                Generate & Record PDF
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
