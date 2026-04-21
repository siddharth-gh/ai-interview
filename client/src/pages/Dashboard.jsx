import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_URL } from '../config/constants';

function Dashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await fetch(`${API_URL}/dashboard/my-interviews`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setInterviews(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchInterviews();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">My History</h1>
            <p className="text-slate-500 text-sm">View your past performance and growth</p>
          </div>
          <Link to="/interview" className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-colors font-medium shadow-lg shadow-cyan-600/20">
            New Interview
          </Link>
        </header>

        <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-6">Interview History</h2>
          
          {loading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
              </div>
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl">
              <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't taken any interviews yet.</p>
              <Link to="/interview" className="text-cyan-600 font-medium hover:underline">Take your first interview &rarr;</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview._id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{interview.role}</h3>
                    <p className="text-sm text-slate-500">{new Date(interview.createdAt).toLocaleDateString()} • {interview.evaluatedCount} questions answered</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 italic">"{interview.notes}"</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{interview.finalScore}<span className="text-sm text-slate-400 font-normal">/10</span></div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
