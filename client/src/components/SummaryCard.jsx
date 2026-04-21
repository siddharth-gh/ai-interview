import ReportDashboard from "./ReportDashboard";

function SummaryCard({ summary, reviews }) {
  if (!summary) return null;

  return <ReportDashboard summary={summary} reviews={reviews} />;
}

export default SummaryCard;
