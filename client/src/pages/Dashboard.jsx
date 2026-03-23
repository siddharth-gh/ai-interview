import React from "react";

const Dashboard = () => {
  const handleStartInterview = () => {
    alert("Starting AI Interview...");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-500">AI Interviewer</h1>
        <button className="bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700">
          Logout
        </button>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center text-center mt-20 px-6">
        <h2 className="text-4xl md:text-5xl font-bold">
          Crack Your Next Interview with{" "}
          <span className="text-blue-500">AI Practice</span>
        </h2>

        <p className="mt-6 text-gray-400 max-w-xl">
          Practice real interview questions, get instant feedback, and improve
          your confidence with AI-powered mock interviews.
        </p>

        <button
          onClick={handleStartInterview}
          className="mt-8 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-lg font-semibold"
        >
          Start AI Interview
        </button>
      </section>

      <section className="mt-24 px-8 grid md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-2xl">
          <h3 className="text-xl font-semibold mb-2">Real Questions</h3>
          <p className="text-gray-400">
            Practice questions similar to real interviews.
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl">
          <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
          <p className="text-gray-400">AI evaluates your answers instantly.</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl">
          <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
          <p className="text-gray-400">See your improvement over time.</p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
