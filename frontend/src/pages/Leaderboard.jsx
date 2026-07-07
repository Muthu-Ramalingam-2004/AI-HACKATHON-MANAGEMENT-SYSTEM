import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Trophy, Medal, Star, Filter, RefreshCw } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const url = selectedHackathon 
        ? `/dashboard/leaderboard?hackathon_id=${selectedHackathon}`
        : '/dashboard/leaderboard';
      const response = await api.get(url);
      setLeaderboard(response.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const response = await api.get('/hackathons');
        setHackathons(response.data);
      } catch (err) {
        console.error('Failed to fetch hackathons list', err);
      }
    };
    fetchHackathons();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedHackathon]);

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div class="flex items-center justify-center h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/35 text-amber-500 dark:text-amber-400">
            <Trophy class="h-4.5 w-4.5" />
          </div>
        );
      case 2:
        return (
          <div class="flex items-center justify-center h-8 w-8 rounded-full bg-slate-300/15 border border-slate-300/35 text-slate-500 dark:text-slate-300">
            <Medal class="h-4.5 w-4.5" />
          </div>
        );
      case 3:
        return (
          <div class="flex items-center justify-center h-8 w-8 rounded-full bg-amber-700/15 border border-amber-700/35 text-amber-700 dark:text-amber-600">
            <Medal class="h-4.5 w-4.5" />
          </div>
        );
      default:
        return <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">{rank}</span>;
    }
  };

  const getRankRowClass = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-amber-500/5 dark:bg-amber-500/10 border-l-2 border-l-amber-500 border-slate-200 dark:border-slate-800/60';
      case 2:
        return 'bg-slate-300/5 dark:bg-slate-300/10 border-l-2 border-l-slate-400 border-slate-200 dark:border-slate-800/60';
      case 3:
        return 'bg-amber-700/5 dark:bg-amber-700/10 border-l-2 border-l-amber-700 border-slate-200 dark:border-slate-800/60';
      default:
        return 'border-b border-slate-200 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800/10';
    }
  };

  return (
    <div class="space-y-6">
      {/* Header card */}
      <div class="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-200 dark:border-slate-800">
        <div class="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-indigo-500/5 blur-3xl"></div>
        <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 class="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
              <Trophy class="h-6 w-6 text-amber-500 mr-2 animate-bounce" />
              Live Leaderboard Standings
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Rankings updated in real-time as judges submit scorecards. Total scores are calculated out of 100.
            </p>
          </div>

          {/* Filters */}
          <div class="flex items-center space-x-3 self-start md:self-auto">
            <div class="relative">
              <Filter class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <select
                value={selectedHackathon}
                onChange={(e) => setSelectedHackathon(e.target.value)}
                class="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Hackathons</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>{h.title}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchLeaderboard}
              class="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <RefreshCw class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      {leaderboard.length > 0 && (
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 2nd Place */}
          {leaderboard[1] && (
            <div class="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center order-2 md:order-1 relative">
              <div class="absolute top-3 right-3 text-slate-400 dark:text-slate-500 text-xs font-bold">2nd Place</div>
              <div class="h-12 w-12 rounded-full bg-slate-300/10 border border-slate-300/35 text-slate-400 dark:text-slate-300 flex items-center justify-center mb-3">
                <Medal class="h-6 w-6" />
              </div>
              <h3 class="font-bold text-slate-800 dark:text-slate-200 truncate max-w-full">{leaderboard[1].team_name}</h3>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{leaderboard[1].hackathon_title}</p>
              <div class="mt-3 text-lg font-extrabold text-slate-700 dark:text-slate-300">{leaderboard[1].total_score} pts</div>
            </div>
          )}

          {/* 1st Place */}
          {leaderboard[0] && (
            <div class="glass-card p-6 rounded-2xl border border-amber-500/20 text-center flex flex-col items-center order-1 md:order-2 relative bg-gradient-to-b from-amber-500/5 to-slate-100 dark:to-slate-900/40">
              <div class="absolute top-3 right-3 text-amber-600 dark:text-amber-500 text-xs font-extrabold flex items-center">
                <Star class="h-3.5 w-3.5 text-amber-500 fill-amber-500 mr-0.5" /> Champion
              </div>
              <div class="h-16 w-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/10">
                <Trophy class="h-8 w-8" />
              </div>
              <h3 class="font-bold text-slate-800 dark:text-white text-lg truncate max-w-full">{leaderboard[0].team_name}</h3>
              <p class="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">{leaderboard[0].hackathon_title}</p>
              <div class="mt-3 text-2xl font-extrabold text-amber-500 dark:text-amber-400">{leaderboard[0].total_score} pts</div>
            </div>
          )}

          {/* 3rd Place */}
          {leaderboard[2] && (
            <div class="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center order-3 relative">
              <div class="absolute top-3 right-3 text-slate-400 dark:text-slate-500 text-xs font-bold">3rd Place</div>
              <div class="h-12 w-12 rounded-full bg-amber-700/10 border border-amber-700/35 text-amber-700 dark:text-amber-600 flex items-center justify-center mb-3">
                <Medal class="h-6 w-6" />
              </div>
              <h3 class="font-bold text-slate-800 dark:text-slate-200 truncate max-w-full">{leaderboard[2].team_name}</h3>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{leaderboard[2].hackathon_title}</p>
              <div class="mt-3 text-lg font-extrabold text-amber-700 dark:text-amber-600">{leaderboard[2].total_score} pts</div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div class="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {isLoading ? (
          <div class="py-12 flex flex-col items-center justify-center">
            <div class="h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p class="text-xs text-slate-500 mt-2">Loading scoreboard standings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div class="py-12 text-center text-slate-500 text-xs">
            No projects have been evaluated yet. Check back later!
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-100/80 dark:bg-slate-900/50 text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800/80">
                  <th class="px-6 py-4.5 text-center w-16">Rank</th>
                  <th class="px-6 py-4.5">Team & Hackathon</th>
                  <th class="px-4 py-4.5 text-center">Inno (25)</th>
                  <th class="px-4 py-4.5 text-center">Tech (25)</th>
                  <th class="px-4 py-4.5 text-center">Feas (25)</th>
                  <th class="px-4 py-4.5 text-center">Pres (25)</th>
                  <th class="px-6 py-4.5 text-right w-32">Total Score</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800/40 text-sm text-slate-700 dark:text-slate-300">
                {leaderboard.map((team) => (
                  <tr key={team.team_id} class={getRankRowClass(team.rank)}>
                    <td class="px-6 py-4 text-center font-bold">
                      <div class="flex justify-center">{getRankBadge(team.rank)}</div>
                    </td>
                    <td class="px-6 py-4">
                      <p class="font-bold text-slate-800 dark:text-white text-sm">{team.team_name}</p>
                      <p class="text-xs text-slate-500 mt-0.5">{team.hackathon_title}</p>
                    </td>
                    <td class="px-4 py-4 text-center font-mono text-xs">{team.innovation_score}</td>
                    <td class="px-4 py-4 text-center font-mono text-xs">{team.technical_score}</td>
                    <td class="px-4 py-4 text-center font-mono text-xs">{team.feasibility_score}</td>
                    <td class="px-4 py-4 text-center font-mono text-xs">{team.presentation_score}</td>
                    <td class="px-6 py-4 text-right">
                      <span class={`font-extrabold text-base ${
                        team.rank === 1 ? 'text-amber-500' : team.rank === 2 ? 'text-slate-500 dark:text-slate-300' : 'text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {team.total_score}
                      </span>
                      <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold ml-1">/100</span>
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

export default Leaderboard;
