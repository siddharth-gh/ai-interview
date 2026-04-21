import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_URL } from '../config/constants';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/dashboard/admin/stats`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">Admin Control Panel</h1>
            <p className="text-slate-500 text-sm">System-wide analytics and user performance</p>
          </div>
        </header>

        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 font-medium uppercase tracking-wider text-sm">Total Users</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-2">{stats?.usersCount || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
              <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 font-medium uppercase tracking-wider text-sm">Total Interviews Taken</p>
                  <p className="text-4xl font-black text-cyan-600 dark:text-cyan-400 mt-2">{stats?.interviewsCount || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold mb-6">Recent Interviews</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500">
                      <th className="pb-3 pr-4">Candidate</th>
                      <th className="pb-3 px-4">Role</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.interviews?.map((interview) => (
                      <tr key={interview._id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="py-4 pr-4">
                          <p className="font-semibold">{interview.user?.name || "Unknown User"}</p>
                          <p className="text-xs text-slate-500">{interview.user?.email}</p>
                        </td>
                        <td className="py-4 px-4 font-medium">{interview.role}</td>
                        <td className="py-4 px-4 text-sm text-slate-500">{new Date(interview.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                            {interview.finalScore}/10
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
