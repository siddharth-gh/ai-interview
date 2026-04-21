import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between py-4 px-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
            AI
          </div>
          <span className="font-bold text-xl tracking-tight">InterviewPro</span>
        </Link>
      </div>
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link to="/dashboard" className="group flex items-center gap-2 text-sm font-medium transition-colors">
              <span className="text-slate-500 dark:text-slate-400 group-hover:text-cyan-600">Welcome,</span>
              <span className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600">{user.name}</span>
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Admin</Link>
            )}
            <button 
              onClick={logout} 
              className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Sign In</Link>
            <Link to="/signup" className="text-sm font-medium px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-transform">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
