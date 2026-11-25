import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, LogOut, User, FileText, CheckSquare, Shield, Users, Bell } from 'lucide-react';
import RecruiterPendingBadge from '../../components/common/RecruiterPendingBadge';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === 'student') {
      return [
        { name: 'Dashboard', path: '/student/dashboard', icon: Briefcase },
        { name: 'Explore Jobs', path: '/student/jobs', icon: Briefcase },
        { name: 'My Applications', path: '/student/applications', icon: CheckSquare },
        { name: 'Profile & Resume', path: '/student/profile', icon: User },
      ];
    }
    if (user.role === 'recruiter') {
      return [
        { name: 'Dashboard', path: '/recruiter/dashboard', icon: Briefcase },
        { name: 'My Postings', path: '/recruiter/jobs', icon: FileText },
        { name: 'Post New Opportunity', path: '/recruiter/jobs/create', icon: Briefcase },
      ];
    }
    if (user.role === 'officer') {
      return [
        { name: 'Overview', path: '/officer/dashboard', icon: Shield },
        { name: 'Manage Users', path: '/officer/users', icon: Users },
        { name: 'Pending Approvals', path: '/officer/approvals', icon: CheckSquare },
        { name: 'All Postings', path: '/officer/jobs', icon: FileText },
        { name: 'Notice Board', path: '/officer/notices', icon: Bell },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
                CH
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">CampusHire</span>
            </Link>
            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user?.role === 'recruiter' && <RecruiterPendingBadge />}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
              <span className="text-xs uppercase tracking-wider text-indigo-600 font-medium">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </header>
  );
};

export default Navbar;
