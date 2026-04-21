function ErrorBanner({ error }) {
  if (!error) return null;

  return (
    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {error}
    </div>
  );
}

export default ErrorBanner;
