function FinishEarlyModal({ open, questionsLeft, onCancel, onConfirm, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-xl font-semibold">Finish Interview Early?</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Still {questionsLeft} questions left. You sure to submit?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Yes, submit now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FinishEarlyModal;
