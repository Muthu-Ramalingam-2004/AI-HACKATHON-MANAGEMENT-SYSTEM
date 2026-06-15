import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
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
  
  // Tab states
  const [activeTab, setActiveTab] = useState('hackathons'); // hackathons, teams, certificates, profile

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

  // Submission Statuses per team
  const [teamSubmissions, setTeamSubmissions] = useState({});

  const showMessage = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  };

  const loadData = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    try {
      await api.post('/teams', {
        team_name: teamName,
        hackathon_id: parseInt(selectedHackathonId)
      });
      setShowCreateTeamModal(false);
      setTeamName('');
      showMessage('success', 'Team registered successfully! You are the leader.');
      loadData();
    } catch (err) {
      showMessage('error', err.response?.data?.detail || 'Failed to register team');
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

  return (
    <div class="space-y-6">
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
            onClick={() => setActiveTab(tab)}
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
            {hackathons.map((hack) => (
              <div key={hack.id} class="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between interactive-hover">
                <div>
                  <div class="h-1.5 w-12 bg-indigo-500 rounded-full mb-4"></div>
                  <h3 class="font-bold text-white text-base leading-tight">{hack.title}</h3>
                  <p class="text-xs text-slate-400 mt-2 line-clamp-3">{hack.description}</p>
                </div>
                <div class="mt-6 border-t border-slate-800/80 pt-4 flex justify-between items-center">
                  <div>
                    <span class="text-[10px] text-slate-500 block">Duration</span>
                    <span class="text-xs font-medium text-slate-300">
                      {new Date(hack.start_date).toLocaleDateString()} - {new Date(hack.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <span class="px-2.5 py-1 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 uppercase">
                    {hack.status}
                  </span>
                </div>
              </div>
            ))}
            {hackathons.length === 0 && (
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
                        <p class="text-xs text-indigo-400 font-medium mt-0.5">{team.hackathon.title}</p>
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
                        {team.members.map((m) => (
                          <div key={m.id} class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs">
                            <div class="h-4.5 w-4.5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[9px] text-indigo-400">
                              {m.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span class="text-slate-300 font-medium">{m.user.name}</span>
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
                      <option key={t.id} value={t.id}>{t.team_name} ({t.hackathon.title})</option>
                    ))}
                  </select>
                  <span class="text-[10px] text-slate-500 mt-1 block">Only team leaders can submit projects.</span>
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
            <h2 class="text-xl font-bold text-white">My Certificates</h2>
            <p class="text-xs text-slate-500 mt-0.5">Download your winner and participation credentials.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            {certificates.map((cert) => (
              <div key={cert.id} class="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between relative overflow-hidden">
                <div class="flex items-center space-x-4">
                  <div class="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                    <Award class="h-6.5 w-6.5" />
                  </div>
                  <div>
                    <h3 class="font-bold text-white capitalize">{cert.certificate_type} Certificate</h3>
                    <p class="text-[10px] font-mono text-slate-500 mt-1">{cert.certificate_number}</p>
                  </div>
                </div>
                <a
                  href={`http://localhost:8000/api/v1/certificates/${cert.id}/download?token=${localStorage.getItem('accessToken')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/5"
                >
                  <Download class="h-4.5 w-4.5" />
                </a>
              </div>
            ))}
            {certificates.length === 0 && (
              <p class="text-slate-500 text-xs py-4 col-span-2 text-center">No certificates generated yet. Stand by until hackathons end.</p>
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
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg cursor-pointer"
              >
                Create and Register Team
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantDashboard;
