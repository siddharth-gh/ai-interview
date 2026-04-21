function CvEvaluationCard({ report }) {
  return (
    <div className="glass-card p-6 rounded-3xl">
      <h2 className="mb-3 text-xl font-semibold">CV Evaluation</h2>
      {report ? (
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-medium">Candidate:</span> {report.name}
          </p>
          <p>
            <span className="font-medium">Score:</span> {report.score}/100
          </p>
          <p>{report.summary}</p>
          <div>
            <div className="mb-1 font-medium">Keywords</div>
            <div className="flex flex-wrap gap-2">
              {report.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload a CV to see extracted keywords and a quick fit score.
        </p>
      )}
    </div>
  );
}

export default CvEvaluationCard;
