import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: Number,
  question: String,
  answer: String,
  score: Number,
  feedback: String,
  metrics: {
    starAdherence: Number,
    clarity: Number,
    technicalDepth: Number
  }
});

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  role: {
    type: String,
    required: true
  },
  finalScore: {
    type: Number,
    default: 0
  },
  evaluatedCount: Number,
  answers: [answerSchema],
  softSkills: {
    starAdherence: Number,
    clarity: Number,
    technicalDepth: Number
  },
  notes: String
}, { timestamps: true });

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
