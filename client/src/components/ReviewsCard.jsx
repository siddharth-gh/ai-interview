function ReviewsCard({ reviews }) {
  return (
    <div className="glass-card p-6 rounded-3xl">
      <h2 className="mb-3 text-xl font-semibold">Reviews</h2>
      <div className="space-y-3">
        {reviews.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Answers will be reviewed here after each submission.
          </p>
        )}
        {reviews.map((item, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span className="mr-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">Q{index + 1}</span>
              {item.question}
            </h3>
            
            <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
              {item.answer ? `"${item.answer}"` : <span className="italic opacity-50">No answer provided.</span>}
            </div>

            {item.status === "recorded" || item.status === "evaluating" ? (
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-600 dark:text-cyan-400">
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                AI is evaluating...
              </div>
            ) : item.status === "failed" ? (
              <div className="rounded-xl bg-rose-50/50 p-3 border border-rose-200/50 dark:bg-rose-900/10 dark:border-rose-900/20">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">AI Not Working</span>
                  <span className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-bold text-rose-800 dark:bg-rose-900/50 dark:text-rose-200">Error</span>
                </div>
                <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">{item.feedback}</p>
              </div>
            ) : (
              <div className="rounded-xl bg-cyan-50/50 p-3 dark:bg-cyan-900/10">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">AI Feedback</span>
                  <span className="rounded-lg bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200">Score: {item.score}/10</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReviewsCard;
