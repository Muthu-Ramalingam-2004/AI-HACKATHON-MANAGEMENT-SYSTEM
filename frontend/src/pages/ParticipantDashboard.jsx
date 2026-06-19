import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { API_URL } from '../utils/api';
import { 
  Code, 
  Users, 
  Plus, 
  Upload, 
  ExternalLink, 
  Award, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  User as UserIcon,
  Briefcase
} from 'lucide-react';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('hackathons'); // hackathons, teams, certificates, profile

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith('/hackathons')) {
      setActiveTab('hackathons');
    } else if (path.endsWith('/teams')) {
      setActiveTab('teams');
    } else if (path.endsWith('/certificates')) {
      setActiveTab('certificates');
    } else if (path.endsWith('/profile') || path === '/dashboard/participant' || path === '/dashboard/participant/') {
      setActiveTab('profile');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileCollege(user.college_id || '');
    }
  }, [user]);

  // Common data
  const [hackathons, setHackathons] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [colleges, setColleges] = useState([]);
  
  // Profile update state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileCollege, setProfileCollege] = useState(user?.college_id || '');
  
  // Team Creation state
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [teamName, setTeamName] = useState('');
  
  // Add member state
  const [memberEmail, setMemberEmail] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // Project submission state
  const [selectedSubmissionTeamId, setSelectedSubmissionTeamId] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [pptFile, setPptFile] = useState(null);

  // Status/Messages
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Submission Statuses per team
  const [teamSubmissions, setTeamSubmissions] = useState({});

  const showMessage = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  };

  const loadData = async () => {
    setIsInitialLoading(true);
    setFetchError(null);
    try {
      const hackRes = await api.get('/hackathons?status=active');
      setHackathons(hackRes.data);

      const teamRes = await api.get('/teams/me');
      setMyTeams(teamRes.data);

      const certRes = await api.get('/certificates/my-certificates');
      setCertificates(certRes.data);

      const colRes = await api.get('/colleges');
      setColleges(colRes.data);

      // Load submissions for my teams
      const subs = {};
      for (const t of teamRes.data) {
        try {
          const subRes = await api.get(`/submissions/team/${t.id}`);
          subs[t.id] = subRes.data;
        } catch (e) {
          subs[t.id] = null;
        }
      }
      setTeamSubmissions(subs);

    } catch (err) {
      console.error("Error loading dashboard data", err);
      setFetchError(err.response?.data?.detail || 'Failed to load dashboard data. Please check your connection or try again.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/me', {
        name: profileName,
        email: profileEmail,
        college_id: profileCollege ? parseInt(profileCollege) : null
      });
      showMessage('success', 'Profile updated successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.detail || 'Failed to update profile');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!selectedHackathonId || !teamName) return;
    setIsLoading(true);
    try {
      const response = await api.post('/teams/', {
        team_name: teamName,
        hackathon_id: parseInt(selectedHackathonId)
      });
      setShowCreateTeamModal(false);
      setTeamName('');
      showMessage('success', 'Team registered successfully! You are the leader.');
      
      // Auto-select the newly registered team immediately
      if (response.data && response.data.id) {
        setSelectedSubmissionTeamId(response.data.id.toString());
      }
      // Navigate to the teams tab immediately
      navigate('/dashboard/participant/teams');
      
      await loadData();
    } catch (err) {
      showMessage('error', err.response?.data?.detail || 'Failed to register team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !memberEmail) return;
    try {
      await api.post(`/teams/${selectedTeamId}/members`, {
        email: memberEmail
      });
      setMemberEmail('');
      showMessage('success', 'Team member added successfully!');
      loadData();
    } catch (err) {
      showMessage('error', err.response?.data?.detail || 'Failed to add member. Make sure they are registered on HackAI.');
    }
  };

  const handleSubmission = async (e) => {
    e.preventDefault();
    if (!selectedSubmissionTeamId || !projectTitle || !pptFile) {
      showMessage('error', 'Project title and PPT file are required.');
      return;
    }

    const formData = new FormData();
    formData.append('team_id', selectedSubmissionTeamId);
    formData.append('project_title', projectTitle);
    formData.append('description', projectDesc);
    formData.append('github_url', githubUrl);
    formData.append('ppt_file', pptFile);

    try {
      setIsLoading(true);
      await api.post('/submissions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage('success', 'Project submitted successfully!');
      setProjectTitle('');
      setProjectDesc('');
      setGithubUrl('');
      setPptFile(null);
      loadData();
    } catch (err) {
      showMessage('error', err.response?.data?.detail || 'Failed to submit project.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading && !fetchError) {
    return (
      <div class="py-12 flex flex-col items-center justify-center">
        <div class="h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p class="text-xs text-slate-500 mt-2 font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Fetch Error Notification */}
      {fetchError && (
        <div class="p-4 rounded-xl border flex items-center justify-between text-sm bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse">
          <div class="flex items-center space-x-2.5">
            <AlertCircle class="h-5 w-5 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button 
            onClick={loadData}
            class="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Alert Notification */}
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
        {['hackathons', 'teams', 'certificates', 'profile'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              if (tab === 'profile') {
                navigate('/dashboard/participant');
              } else {
                navigate(`/dashboard/participant/${tab}`);
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

      {/* TABS CONTENT */}

      {/* 1. Hackathons Tab */}
      {activeTab === 'hackathons' && (
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-bold text-white">Available AI Hackathons</h2>
              <p class="text-xs text-slate-500 mt-0.5">Explore active challenges and register to build your project.</p>
            </div>
            <button
              onClick={() => setShowCreateTeamModal(true)}
              class="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 cursor-pointer"
            >
              <Plus class="h-4 w-4 mr-1.5" />
              Register Team
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hackathons?.map((hack) => (
              <div key={hack?.id} class="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between interactive-hover">
                <div>
                  <div class="h-1.5 w-12 bg-indigo-500 rounded-full mb-4"></div>
                  <h3 class="font-bold text-white text-base leading-tight">{hack?.title || 'Untitled Hackathon'}</h3>
                  <p class="text-xs text-slate-400 mt-2 line-clamp-3">{hack?.description || ''}</p>
                </div>
                <div class="mt-6 border-t border-slate-800/80 pt-4 flex justify-between items-center">
                  <div>
                    <span class="text-[10px] text-slate-500 block">Duration</span>
                    <span class="text-xs font-medium text-slate-300">
                      {hack?.start_date ? new Date(hack.start_date).toLocaleDateString() : ''} - {hack?.end_date ? new Date(hack.end_date).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <span class="px-2.5 py-1 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 uppercase">
                    {hack?.status || ''}
                  </span>
                </div>
              </div>
            ))}
            {(!hackathons || hackathons.length === 0) && (
              <p class="text-slate-500 text-xs py-4 col-span-3 text-center">No active hackathons at the moment.</p>
            )}
          </div>
        </div>
      )}

      {/* 2. Teams & Project Submissions */}
      {activeTab === 'teams' && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams list */}
          <div class="lg:col-span-2 space-y-6">
            <h2 class="text-xl font-bold text-white">My Registered Teams</h2>
            <div class="space-y-4">
              {myTeams.map((team) => {
                const isLeader = team.leader_id === user?.id;
                const submission = teamSubmissions[team.id];
                return (
                  <div key={team.id} class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="font-bold text-white text-base">{team.team_name}</h3>
                        <p class="text-xs text-indigo-400 font-medium mt-0.5">{team.hackathon?.title || 'Unknown Hackathon'}</p>
                      </div>
                      <span class={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase ${
                        isLeader 
                          ? 'bg-amber-500/15 border-amber-500/20 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {isLeader ? 'Leader' : 'Member'}
                      </span>
                    </div>

                    {/* Members List */}
                    <div>
                      <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Members</h4>
                      <div class="flex flex-wrap gap-2">
                        {team.members?.map((m) => (
                          <div key={m.id} class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs">
                            <div class="h-4.5 w-4.5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] text-indigo-400">
                              {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span class="text-slate-300 font-medium">{m.user?.name || 'Unknown Member'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add member box (Leader only) */}
                    {isLeader && (
                      <form onSubmit={handleAddMember} class="border-t border-slate-800/80 pt-4 flex space-x-3">
                        <input
                          type="email"
                          required
                          placeholder="teammate@email.com"
                          value={selectedTeamId === team.id ? memberEmail : ''}
                          onChange={(e) => {
                            setSelectedTeamId(team.id);
                            setMemberEmail(e.target.value);
                          }}
                          class="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Add Teammate
                        </button>
                      </form>
                    )}

                    {/* Submission status */}
                    <div class="border-t border-slate-800/80 pt-4 flex justify-between items-center text-xs">
                      <span class="text-slate-500">Project Status:</span>
                      {submission ? (
                        <div class="flex items-center text-emerald-400 font-semibold space-x-1">
                          <CheckCircle class="h-4 w-4" />
                          <span>Submitted: {submission.project_title}</span>
                        </div>
                      ) : (
                        <span class="text-amber-500 font-semibold">Pending Submission</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {myTeams.length === 0 && (
                <p class="text-slate-500 text-xs py-4 text-center">You are not registered in any teams yet.</p>
              )}
            </div>
          </div>

          {/* Submission Portal */}
          <div class="space-y-6">
            <h2 class="text-xl font-bold text-white font-sans">Project Submission Portal</h2>
            <div class="glass-card p-6 rounded-2xl border border-slate-800">
              <form onSubmit={handleSubmission} class="space-y-4">
                <div>
                  <label for="sub_team" class="block text-xs font-medium text-slate-300">
                    Select Your Team
                  </label>
                  <select
                    id="sub_team"
                    required
                    value={selectedSubmissionTeamId}
                    onChange={(e) => setSelectedSubmissionTeamId(e.target.value)}
                    class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="">Choose a team...</option>
                    {myTeams.filter(t => t.leader_id === user?.id).map((t) => (
                      <option key={t.id} value={t.id}>{t.team_name} ({t.hackathon?.title || 'Unknown Hackathon'})</option>
                    ))}
                  </select>
                  <span class="text-[10px] text-slate-500 mt-1 block">Only team leaders can submit projects.</span>
                  {myTeams.filter(t => t.leader_id === user?.id).length === 0 && (
                    <span class="text-[10px] text-rose-400 mt-1.5 block">
                      You must be the leader of a team in an active hackathon to submit projects.
                    </span>
                  )}
                </div>

                <div>
                  <label for="proj_title" class="block text-xs font-medium text-slate-300">
                    Project Title *
                  </label>
                  <input
                    id="proj_title"
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="AI Solution Name"
                  />
                </div>

                <div>
                  <label for="proj_desc" class="block text-xs font-medium text-slate-300">
                    Brief Description
                  </label>
                  <textarea
                    id="proj_desc"
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    rows="3"
                    class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="What problem does your AI app solve?"
                  />
                </div>

                <div>
                  <label for="proj_github" class="block text-xs font-medium text-slate-300">
                    GitHub Repository URL
                  </label>
                  <input
                    id="proj_github"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="https://github.com/username/repo"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-300">
                    PPT / Slide Deck Upload *
                  </label>
                  <div class="mt-1.5 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-800 border-dashed rounded-xl hover:border-slate-700 transition-colors bg-slate-900/40 relative">
                    <div class="space-y-1.5 text-center">
                      <Upload class="mx-auto h-8 w-8 text-slate-500" />
                      <div class="flex text-xs text-slate-400">
                        <label for="file_upload" class="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-300">
                          <span>Upload a file</span>
                          <input
                            id="file_upload"
                            name="file_upload"
                            type="file"
                            accept=".ppt,.pptx,.pdf"
                            required
                            onChange={(e) => setPptFile(e.target.files[0])}
                            class="sr-only"
                          />
                        </label>
                        <p class="pl-1">or drag and drop</p>
                      </div>
                      <p class="text-[10px] text-slate-500">PPT, PPTX or PDF up to 10MB</p>
                      {pptFile && (
                        <p class="text-xs text-indigo-400 font-semibold mt-2 flex items-center justify-center">
                          <FileText class="h-4 w-4 mr-1 shrink-0" /> {pptFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center"
                >
                  {isLoading ? (
                    <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Submit Project File'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Certificates Tab */}
      {activeTab === 'certificates' && (
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-bold text-white font-sans">My Certificates</h2>
            <p class="text-xs text-slate-500 mt-0.5">View and download your official winner and participation credentials.</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {certificates?.map((cert) => {
              const isWinner = cert?.certificate_type?.toLowerCase() === 'winner';
              const certTitle = isWinner ? 'Certificate of Excellence' : 'Certificate of Participation';
              const formattedDate = cert?.generated_at 
                ? new Date(cert.generated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

              return (
                <div key={cert?.id} class="glass-card p-6 rounded-3xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden hover:border-indigo-500/30 transition-all group duration-300">
                  {/* Decorative glow */}
                  <div class={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-all duration-500 ${
                    isWinner ? 'bg-amber-500/10' : 'bg-indigo-500/10'
                  }`}></div>
                  
                  <div class="space-y-4">
                    <div class="flex items-start justify-between">
                      <div class="flex items-center space-x-3.5">
                        <div class={`h-12 w-12 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${
                          isWinner 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          <Award class="h-6.5 w-6.5" />
                        </div>
                        <div>
                          <h3 class="font-bold text-white text-base tracking-tight">{certTitle}</h3>
                          <p class="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">{cert?.certificate_number}</p>
                        </div>
                      </div>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-x-1">
                        <CheckCircle class="h-3 w-3 shrink-0" />
                        <span>Verified</span>
                      </span>
                    </div>

                    <div class="border-t border-slate-800/60 pt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-400">
                      <div>
                        <span class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Event / Challenge</span>
                        <span class="font-semibold text-slate-300 truncate block mt-0.5">{cert?.hackathon_title || 'AI Hackathon'}</span>
                      </div>
                      <div>
                        <span class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Recipient</span>
                        <span class="font-semibold text-slate-300 truncate block mt-0.5">{cert?.user?.name || user?.name}</span>
                      </div>
                      <div>
                        <span class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Date Issued</span>
                        <span class="font-medium text-slate-400 block mt-0.5">{formattedDate}</span>
                      </div>
                      <div>
                        <span class="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Issuer</span>
                        <span class="font-medium text-slate-400 block mt-0.5">HackAI Global</span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 pt-3.5 border-t border-slate-800/55 flex justify-end">
                    <a
                      href={`${API_URL}/certificates/${cert?.id}/download?token=${localStorage.getItem('accessToken')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center px-4 py-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-400 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer shadow-lg shadow-black/15 group/btn"
                    >
                      <Download class="h-4 w-4 mr-1.5 transition-transform group-hover/btn:-translate-y-0.5" />
                      Download PDF
                    </a>
                  </div>
                </div>
              );
            })}

            {(!certificates || certificates.length === 0) && (
              <div class="col-span-1 lg:col-span-2 flex flex-col items-center justify-center p-12 text-center glass-card border border-slate-800/80 rounded-3xl mt-4 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/0 to-transparent pointer-events-none"></div>
                <div class="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl shadow-indigo-500/5 animate-pulse">
                  <Award class="h-8 w-8" />
                </div>
                <h3 class="text-lg font-bold text-white mb-2 font-sans">No Certificates Available Yet</h3>
                <p class="text-xs text-slate-400 max-w-sm">
                  Certificates are automatically generated when you submit a project for an active hackathon, or when your project is completed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Profile Tab */}
      {activeTab === 'profile' && (
        <div class="max-w-md space-y-6">
          <div>
            <h2 class="text-xl font-bold text-white">Profile Settings</h2>
            <p class="text-xs text-slate-500 mt-0.5">Manage your personal credentials and academic affiliation.</p>
          </div>

          <div class="glass-card p-6 rounded-2xl border border-slate-800">
            <form onSubmit={handleUpdateProfile} class="space-y-4">
              <div>
                <label for="prof_name" class="block text-xs font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  id="prof_name"
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label for="prof_email" class="block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <input
                  id="prof_email"
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label for="prof_college" class="block text-xs font-medium text-slate-300">
                  College Affiliation
                </label>
                <select
                  id="prof_college"
                  value={profileCollege}
                  onChange={(e) => setProfileCollege(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                >
                  <option value="">Select College</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>{c.college_name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TEAM CREATION MODAL */}
      {showCreateTeamModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div class="glass-card w-full max-w-md p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-bold text-white">Register Team</h3>
              <button 
                onClick={() => setShowCreateTeamModal(false)}
                class="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTeam} class="space-y-4">
              <div>
                <label for="modal_hack" class="block text-xs font-medium text-slate-300">
                  Select Hackathon
                </label>
                <select
                  id="modal_hack"
                  required
                  value={selectedHackathonId}
                  onChange={(e) => setSelectedHackathonId(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="">Choose hackathon...</option>
                  {hackathons.map((h) => (
                    <option key={h.id} value={h.id}>{h.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label for="modal_team_name" class="block text-xs font-medium text-slate-300">
                  Team Name *
                </label>
                <input
                  id="modal_team_name"
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
                  placeholder="E.g., Neural Knights"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-semibold shadow-lg cursor-pointer flex items-center justify-center"
              >
                {isLoading ? (
                  <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Create and Register Team'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantDashboard;
