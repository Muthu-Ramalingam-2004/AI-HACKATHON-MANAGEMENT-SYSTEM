import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Users, School, Trophy, Award, Search, CheckCircle } from 'lucide-react';

const CollegeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students_count: 0, teams_count: 0 });
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/dashboard/college');
      setStats(response.data.stats);
      setStudents(response.data.students);
    } catch (err) {
      console.error('Failed to fetch college stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div class="space-y-6">
      {/* College Info panel */}
      <div class="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div class="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-indigo-500/5 blur-3xl"></div>
        <div class="flex items-center space-x-4">
          <div class="h-14 w-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <School class="h-7 w-7" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-white">
              {user?.college?.college_name || 'College Dashboard'}
            </h2>
            <p class="text-xs text-indigo-400 mt-0.5">
              Tracking student participation, team counts, and performance rankings.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-500 block">Registered Students</span>
            <span class="text-3xl font-extrabold text-white mt-1 block">{stats.students_count}</span>
          </div>
          <div class="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/15">
            <Users class="h-6 w-6" />
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-500 block">Total Team Registrations</span>
            <span class="text-3xl font-extrabold text-white mt-1 block">{stats.teams_count}</span>
          </div>
          <div class="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/15">
            <Trophy class="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Search and Students list */}
      <div class="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div class="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 class="font-bold text-white text-base">Registered Students Directory</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Explore active teams and student affiliations.</p>
          </div>

          <div class="relative w-full sm:w-72">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              class="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div class="py-12 flex flex-col items-center justify-center">
            <div class="h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p class="text-xs text-slate-500 mt-2">Loading college records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div class="py-12 text-center text-slate-500 text-xs">
            No students found matching current criteria.
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-900/50 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                  <th class="px-6 py-4">Student Name</th>
                  <th class="px-6 py-4">Email Address</th>
                  <th class="px-6 py-4 text-center">Active Hackathons</th>
                  <th class="px-6 py-4">Teams Info</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-sm text-slate-300">
                {filteredStudents.map((student) => (
                  <tr key={student.id} class="hover:bg-slate-800/10">
                    <td class="px-6 py-4 font-bold text-white">{student.name}</td>
                    <td class="px-6 py-4 text-xs font-mono text-slate-400">{student.email}</td>
                    <td class="px-6 py-4 text-center">
                      <span class="px-2 py-0.5 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                        {student.teams_count}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      {student.teams.length > 0 ? (
                        <div class="flex flex-wrap gap-1.5 max-w-sm">
                          {student.teams.map((t, idx) => (
                            <span key={idx} class="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400">
                              <b>{t.team_name}</b> ({t.hackathon})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span class="text-slate-500 text-xs">Not in a team</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeDashboard;
