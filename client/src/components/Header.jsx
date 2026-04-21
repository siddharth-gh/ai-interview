function Header({ darkMode, onToggleDarkMode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Upload a CV, extract keywords, then run a 10-question interview with audio answers.
        </p>
      </div>
      <button
        onClick={onToggleDarkMode}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        {darkMode ? "Light mode" : "Dark mode"}
      </button>
    </div>
  );
}

export default Header;
