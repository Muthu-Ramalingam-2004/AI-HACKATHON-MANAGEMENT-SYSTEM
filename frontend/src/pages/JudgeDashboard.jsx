import React, { useState, useEffect } from 'react';
import api, { API_URL } from '../utils/api';
import { 
  ClipboardCheck, 
  FileText, 
  ExternalLink, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  Award
} from 'lucide-react';

const BASE_URL = API_URL.replace('/api/v1', '');

const JudgeDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total_submissions: 0, evaluated_submissions: 0, pending_submissions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Evaluation Modal state
  const [selectedSub, setSelectedSub] = useState(null);
  const [innovation, setInnovation] = useState(0);
  const [technical, setTechnical] = useState(0);
  const [feasibility, setFeasibility] = useState(0);
  const [presentation, setPresentation] = useState(0);
  const [comments, setComments] = useState('');

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submittingEval, setSubmittingEval] = useState(false);

  const showMessage = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  };

  const fetchStatsAndSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/dashboard/judge');
      setStats(response.data.stats);
      setSubmissions(response.data.submissions);
    } catch (err) {
      console.error('Failed to load judge dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndSubmissions();
  }, []);

  const openEvaluationModal = (sub) => {
    setSelectedSub(sub);
    if (sub.is_evaluated && sub.scores) {
      setInnovation(sub.scores.innovation);
      setTechnical(sub.scores.technical);
      setFeasibility(sub.scores.feasibility);
      setPresentation(sub.scores.presentation);
      setComments(sub.scores.comments || '');
    } else {
      setInnovation(0);
      setTechnical(0);
      setFeasibility(0);
      setPresentation(0);
      setComments('');
    }
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEval(true);
    try {
      await api.post('/evaluations/', {
        submission_id: selectedSub.id,
        innovation_score: parseInt(innovation),
        technical_score: parseInt(technical),
        feasibility_score: parseInt(feasibility),
        presentation_score: parseInt(presentation),
        comments: comments
      });
      setSelectedSub(null);
      showMessage('success', 'Evaluation submitted successfully!');
      fetchStatsAndSubmissions();
    } catch (err) {
      showMessage('error', err.response?.data?.detail || 'Failed to submit evaluation');
    } finally {
      setSubmittingEval(false);
    }
  };

  return (
    <div class="space-y-6">
      {/* Messages */}
      {msg.text && (
        <div class={`p-4 rounded-xl border flex items-center space-x-2.5 text-sm ${
          msg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          {msg.type === 'success' ? <CheckCircle class="h-5 w-5 shrink-0" /> : <AlertCircle class="h-5 w-5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Header Info */}
      <div class="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
        <div class="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-indigo-500/5 blur-3xl"></div>
        <div class="flex items-center space-x-4">
          <div class="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ClipboardCheck class="h-7 w-7" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Expert Evaluation Panel</h2>
            <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
              Score project submissions based on innovation, technical strength, feasibility, and presentation quality.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">Total Projects</span>
            <span class="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{stats.total_submissions}</span>
          </div>
          <div class="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/15">
            <FileText class="h-5 w-5" />
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">Evaluated</span>
            <span class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{stats.evaluated_submissions}</span>
          </div>
          <div class="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">
            <CheckCircle class="h-5 w-5" />
          </div>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">Pending</span>
            <span class="text-2xl font-extrabold text-amber-600 dark:text-amber-500 mt-1 block">{stats.pending_submissions}</span>
          </div>
          <div class="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 border border-amber-500/15">
            <HelpCircle class="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-slate-800 dark:text-white">Projects Submitted</h3>
        
        {isLoading ? (
          <div class="py-12 flex flex-col items-center justify-center">
            <div class="h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading projects...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div class="glass-card p-12 text-center text-slate-500 dark:text-slate-400 text-xs rounded-2xl border border-slate-200 dark:border-slate-800">
            No projects have been submitted to the portal yet.
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            {submissions.map((sub) => (
              <div key={sub.id} class="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div class="space-y-3">
                  <div class="flex justify-between items-start">
                    <div>
                      <span class="text-[10px] text-indigo-650 dark:text-indigo-400 font-semibold tracking-wide uppercase">{sub.hackathon_title}</span>
                      <h4 class="font-bold text-slate-800 dark:text-white text-base mt-0.5">{sub.project_title}</h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">By Team: <span class="text-slate-700 dark:text-slate-300 font-semibold">{sub.team_name}</span></p>
                    </div>
                    <span class={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase ${
                      sub.is_evaluated
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {sub.is_evaluated ? 'Evaluated' : 'Pending'}
                    </span>
                  </div>

                  <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">{sub.description}</p>
                  
                  {/* File Links */}
                  <div class="flex flex-wrap gap-2 pt-2 text-xs">
                    {sub.github_url && (
                      <a 
                        href={sub.github_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        class="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                      >
                        <ExternalLink class="h-3.5 w-3.5 mr-1" /> GitHub Repo
                      </a>
                    )}
                    {sub.ppt_file && (
                      <a 
                        href={`${BASE_URL}/${sub.ppt_file.replace('\\', '/')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        class="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                      >
                        <FileText class="h-3.5 w-3.5 mr-1" /> View PPT Slides
                      </a>
                    )}
                  </div>
                </div>

                <div class="mt-6 border-t border-slate-200 dark:border-slate-800/80 pt-4 flex justify-between items-center">
                  <div>
                    {sub.is_evaluated ? (
                      <div class="flex items-center space-x-1">
                        <span class="text-xs text-slate-500">Your Score:</span>
                        <span class="text-sm font-bold text-indigo-650 dark:text-indigo-400">{sub.scores.total}</span>
                        <span class="text-[10px] text-slate-500">/100</span>
                      </div>
                    ) : (
                      <span class="text-xs text-slate-500">Not Graded</span>
                    )}
                  </div>
                  <button
                    onClick={() => openEvaluationModal(sub)}
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/15"
                  >
                    {sub.is_evaluated ? 'Edit Scorecard' : 'Grade Submission'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EVALUATION DIALOG / MODAL */}
      {selectedSub && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-sm">
          <div class="glass-card w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-bold text-slate-800 dark:text-white">Grade Project: {selectedSub.project_title}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Team: {selectedSub.team_name} | {selectedSub.hackathon_title}</p>
              </div>
              <button 
                onClick={() => setSelectedSub(null)}
                class="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleEvaluateSubmit} class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                {/* Innovation */}
                <div class="space-y-1">
                  <label class="text-xs font-medium text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Innovation</span>
                    <span class="text-indigo-600 dark:text-indigo-400 font-bold">{innovation}/25</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={innovation}
                    onChange={(e) => setInnovation(e.target.value)}
                    class="w-full h-1.5 bg-slate-105 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Technical Skills */}
                <div class="space-y-1">
                  <label class="text-xs font-medium text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Technical Skills</span>
                    <span class="text-indigo-600 dark:text-indigo-400 font-bold">{technical}/25</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={technical}
                    onChange={(e) => setTechnical(e.target.value)}
                    class="w-full h-1.5 bg-slate-105 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Feasibility */}
                <div class="space-y-1">
                  <label class="text-xs font-medium text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Feasibility</span>
                    <span class="text-indigo-600 dark:text-indigo-400 font-bold">{feasibility}/25</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={feasibility}
                    onChange={(e) => setFeasibility(e.target.value)}
                    class="w-full h-1.5 bg-slate-105 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Presentation */}
                <div class="space-y-1">
                  <label class="text-xs font-medium text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>Presentation</span>
                    <span class="text-indigo-600 dark:text-indigo-400 font-bold">{presentation}/25</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    class="w-full h-1.5 bg-slate-105 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Total Score display */}
              <div class="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-semibold">
                <span class="text-slate-500 dark:text-slate-400">Total Scorecard Value:</span>
                <span class="text-base text-indigo-605 dark:text-indigo-400 font-extrabold">
                  {parseInt(innovation) + parseInt(technical) + parseInt(feasibility) + parseInt(presentation)} <span class="text-xs font-medium text-slate-500">/100</span>
                </span>
              </div>

              <div>
                <label for="eval_comments" class="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Judgement & Feedback
                </label>
                <textarea
                  id="eval_comments"
                  rows="3"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  class="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Provide details on project strengths, flaws, or advice..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingEval}
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                {submittingEval ? 'Submitting scorecard...' : 'Submit Scorecard'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeDashboard;
