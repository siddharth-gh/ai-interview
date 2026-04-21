function PreparingCard({ countdown }) {
  return (
    <div className="mt-4 rounded-3xl border border-cyan-200 bg-cyan-50 p-8 text-center dark:border-cyan-900 dark:bg-cyan-950/30">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">Get Ready</p>
      <p className="mt-3 text-6xl font-black bg-gradient-to-br from-cyan-500 to-blue-600 bg-clip-text text-transparent">
        {countdown > 0 ? countdown : "..."}
      </p>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        {countdown > 3
          ? "Analyzing your CV and preparing tailored questions..."
          : countdown > 1
            ? "Almost ready! Take a deep breath..."
            : countdown === 1
              ? "Here we go!"
              : "Starting interview..."}
      </p>
      <div className="mt-4 flex justify-center gap-1.5">
        {[5, 4, 3, 2, 1].map((n) => (
          <div
            key={n}
            className={`h-2 w-8 rounded-full transition-all duration-500 ${
              n > countdown
                ? "bg-cyan-500"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default PreparingCard;
