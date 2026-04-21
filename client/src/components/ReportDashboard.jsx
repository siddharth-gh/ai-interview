import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

function ReportDashboard({ summary, reviews }) {
  if (!summary) return null;


  const questionData = reviews.map((r, i) => ({
    name: `Q${i + 1}`,
    score: r.score || 0,
  }));

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Interview Performance Report</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{summary.notes}</p>
      </div>

      <div className="grid gap-6">
        {/* Bar Chart for Question Scores */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Question Breakdown</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questionData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" radius={[6, 6, 6, 6]}>
                  {questionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-6 dark:bg-slate-800/50">
          <div className="text-sm font-medium text-slate-500">Overall Score</div>
          <div className="mt-1 text-4xl font-black text-cyan-600 dark:text-cyan-400">{summary.averageScore}</div>
          <div className="text-xs text-slate-400">out of 10</div>
        </div>
        <div className="rounded-3xl bg-slate-50 p-6 dark:bg-slate-800/50">
          <div className="text-sm font-medium text-slate-500">Questions</div>
          <div className="mt-1 text-4xl font-black text-slate-700 dark:text-slate-200">{summary.evaluatedCount}</div>
          <div className="text-xs text-slate-400">responses evaluated</div>
        </div>
      </div>
    </div>
  );
}

export default ReportDashboard;
