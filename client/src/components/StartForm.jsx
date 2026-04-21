function StartForm({ name, onNameChange, devMode, onDevModeChange, cv, onCvChange, difficulty, onDifficultyChange, interviewType, onInterviewTypeChange, loading, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-3 outline-none focus:border-cyan-500 dark:border-slate-700"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">CV</label>
        {cv && (
          <p className="mb-2 text-xs text-emerald-600 dark:text-emerald-400">✓ {cv.name} loaded</p>
        )}
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => onCvChange(e.target.files?.[0] || null)}
          className="block w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm dark:border-slate-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Interview Type</label>
          <select
            value={interviewType}
            onChange={(e) => onInterviewTypeChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="technical">🛠 Technical</option>
            <option value="behavioral">🧠 Behavioral</option>
            <option value="mixed">⚡ Mixed</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <input 
          type="checkbox" 
          id="devModeToggle"
          checked={devMode}
          onChange={(e) => onDevModeChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600 dark:border-slate-600 dark:bg-slate-700"
        />
        <label htmlFor="devModeToggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Fast Dev Mode (Use Mock Questions)
        </label>
      </div>
      <button
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {loading ? "Analyzing CV..." : "🚀 Start Interview"}
      </button>
    </form>
  );
}

export default StartForm;
