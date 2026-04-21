import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center p-2 pb-4">
        <div className="max-w-4xl w-full text-center space-y-4">
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-cyan-500 to-blue-600 bg-clip-text text-transparent pb-1">
          Master Your Next Interview
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          AI-powered mock interviews tailored to your exact CV and target role. Practice with real-time feedback and dynamic difficulty.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {user ? (
            <Link 
              to="/interview"
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all hover:-translate-y-1"
            >
              Start New Interview
            </Link>
          ) : (
            <Link 
              to="/signup"
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all hover:-translate-y-1"
            >
              Create Your Free Account
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-6">
          <div className="glass-card p-5 rounded-3xl text-left border border-slate-200 dark:border-slate-800">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <h3 className="text-base font-bold mb-1">Deep CV Parsing</h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Questions are generated dynamically based on your actual experience and projects.</p>
          </div>
          <div className="glass-card p-5 rounded-3xl text-left border border-slate-200 dark:border-slate-800">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
            <h3 className="text-base font-bold mb-1">Real-time Feedback</h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Get instant AI-driven scores on your clarity, technical depth, and STAR method adherence.</p>
          </div>
          <div className="glass-card p-5 rounded-3xl text-left border border-slate-200 dark:border-slate-800">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect width="4" height="7" x="7" y="10" rx="1"/><rect width="4" height="12" x="15" y="5" rx="1"/></svg>
            </div>
            <h3 className="text-base font-bold mb-1">Track Progress</h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Create an account to save your interview history and watch your scores improve over time.</p>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}

export default LandingPage;
