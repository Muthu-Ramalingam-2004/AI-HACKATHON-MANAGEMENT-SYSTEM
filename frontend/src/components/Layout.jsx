import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Trophy, 
  Award, 
  Users, 
  School, 
  Code, 
  ClipboardCheck, 
  LogOut, 
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar links based on role
  const getSidebarLinks = () => {
    const common = [
      { name: 'Leaderboard', path: '/leaderboard', icon: Trophy }
    ];

    const roleLinks = {
      admin: [
        { name: 'Overview', path: '/dashboard/admin', icon: LayoutDashboard },
        { name: 'Hackathons', path: '/dashboard/admin/hackathons', icon: Code },
        { name: 'Colleges', path: '/dashboard/admin/colleges', icon: School },
        { name: 'Users', path: '/dashboard/admin/users', icon: Users },
        { name: 'Certificates', path: '/dashboard/admin/certificates', icon: Award }
      ],
      college: [
        { name: 'Overview', path: '/dashboard/college', icon: LayoutDashboard },
        { name: 'Students', path: '/dashboard/college/students', icon: Users }
      ],
      judge: [
        { name: 'Overview', path: '/dashboard/judge', icon: LayoutDashboard },
        { name: 'Evaluation Portal', path: '/dashboard/judge/evaluate', icon: ClipboardCheck }
      ],
      participant: [
        { name: 'My Profile', path: '/dashboard/participant', icon: UserIcon },
        { name: 'Hackathons', path: '/dashboard/participant/hackathons', icon: Code },
        { name: 'My Teams', path: '/dashboard/participant/teams', icon: Users },
        { name: 'My Certificates', path: '/dashboard/participant/certificates', icon: Award }
      ]
    };

    return [...(roleLinks[user?.role] || []), ...common];
  };

  const navLinks = getSidebarLinks();

  const renderNavItems = () => (
    <nav class="space-y-1.5 px-3 py-6">
      {navLinks.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            class={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
              isActive
                ? 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-600/5'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Icon class={`mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
              isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'
            }`} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div class="min-h-screen bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <aside class="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-800/80 shadow-2xl z-20">
        {/* Brand */}
        <div class="h-20 flex items-center px-6 border-b border-slate-800/80">
          <div class="flex items-center space-x-3">
            <div class="h-10 w-10 rounded-xl animated-gradient flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Code class="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <span class="text-lg font-bold tracking-tight text-white block">HackAI</span>
              <span class="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">Management Portal</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <div class="flex-1 overflow-y-auto">
          {renderNavItems()}
        </div>

        {/* User Card & Logout */}
        <div class="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div class="flex items-center space-x-3 mb-4 p-2 rounded-xl bg-slate-800/25">
            <div class="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
              <p class="text-[11px] text-indigo-400 font-medium capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            class="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/25 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <LogOut class="mr-2 h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Modal */}
      <aside class={`fixed top-0 bottom-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-40 transition-transform duration-300 lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div class="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <div class="flex items-center space-x-3">
            <div class="h-10 w-10 rounded-xl animated-gradient flex items-center justify-center shadow-lg">
              <Code class="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <span class="text-lg font-bold text-white">HackAI</span>
              <span class="text-[10px] text-slate-500 font-medium block">Management Portal</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            class="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          {renderNavItems()}
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={handleLogout}
            class="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut class="mr-2 h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div class="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header class="h-20 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-4 sm:px-8 z-10">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            class="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <Menu class="h-6 w-6" />
          </button>
          
          <div class="hidden sm:block">
            <h1 class="text-xl font-bold text-white flex items-center">
              Welcome back, <span class="text-indigo-400 ml-1.5">{user?.name}</span> 👋
            </h1>
          </div>

          <div class="flex items-center space-x-4">
            <div class="text-right hidden md:block">
              <span class="text-xs text-slate-500 block">Institution</span>
              <span class="text-sm font-semibold text-slate-300">
                {user?.college?.college_name || 'System Organizer'}
              </span>
            </div>
            <div class="h-10 w-10 rounded-full animated-gradient p-0.5 shadow-lg shadow-indigo-500/10">
              <div class="h-full w-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-indigo-400">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main class="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
