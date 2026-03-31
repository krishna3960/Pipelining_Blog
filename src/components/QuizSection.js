import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const questions = [
  {
    id: 1,
    title: 'Example 1',
    code: `x = y + z;
a = b - c;
p = q * r;`,
    description:
      'A 5-stage pipeline (IF → ID → EX → MEM → WB). Each instruction takes 1 cycle per stage. These 3 instructions have NO dependency on each other.',
    question:
      'Assuming pipelining, how many cycles does it take to complete all 3 instructions?',
    answer: 7,
    explanation:
      'With pipelining and no hazards: 5 stages + (N−1) = 5 + 2 = 7 cycles. Once the pipeline is full, one instruction completes every cycle.',
  },
  {
    id: 2,
    title: 'Example 2',
    code: `x = y + z;
a = x - b;    
p = a * q;    `,
    description:
      'Same 5-stage pipeline. Each instruction depends on the result of the previous one (Read After Write hazard). A dependent instruction must wait until the previous one reaches WB before it can proceed to EX.',
    question:
      'Assuming pipelining , how many cycles does it take to complete all 3 instructions?',
    answer: 11,
    explanation:
      'With pipelining, each RAW hazard inserts 2 stall cycles. Two hazards = 4 extra stall cycles. Base pipelined cost is 7 cycles, so total = 7 + 4 = 11 cycles.',
  },
];

export default function QuizSection({ onFinish }) {
  const [answers, setAnswers] = useState({ 1: '', 2: '' });
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers[1] !== '' && answers[2] !== '';

  const handleSubmit = () => {
    setSubmitted(true);
    const results = questions.map((q) => ({
      questionId: q.id,
      answer: parseInt(answers[q.id]),
      correct: parseInt(answers[q.id]) === q.answer,
    }));
    const score = results.filter((r) => r.correct).length;
    addDoc(collection(db, 'warmupResults'), {
      results,
      score,
      total: questions.length,
      timestamp: serverTimestamp(),
    }).catch(() => {});
  };

  return (
    <section className="section">
      <div className="section-intro">
        <h2>Warm-Up Quiz</h2>
        <p>
          Let's see what you already know about pipelining. For each code
          snippet below, figure out how many cycles it takes on a{' '}
          <strong>pipelined</strong> 5-stage processor (IF → ID → EX → MEM → WB).
          Think carefully — the two snippets look similar but behave very differently!
        </p>
      </div>

      {questions.map((q) => (
        <div key={q.id} className="quiz-card">
          <div className="quiz-card-header">
            <span className="quiz-number">Q{q.id}</span>
            <h3>{q.title}</h3>
          </div>

          <pre className="code-block">{q.code}</pre>
          <p className="quiz-description">{q.description}</p>

          <div className="quiz-question">
            <p>
              <strong>{q.question}</strong>
            </p>

            <div className="answer-row">
              <input
                type="number"
                className="answer-input"
                placeholder="cycles"
                value={answers[q.id]}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
                disabled={submitted}
              />
              <span className="cycles-label">cycles</span>
            </div>
          </div>
        </div>
      ))}

      {!submitted && (
        <div className="section-cta">
          <button
            className="cta-btn"
            onClick={handleSubmit}
            disabled={!allAnswered}
          >
            Submit Answers
          </button>
          {!allAnswered && (
            <p className="cta-note">Answer both questions to submit.</p>
          )}
        </div>
      )}

      {submitted && (
        <div className="section-cta">
          <p>
            Your answers have been recorded. Read on to find out
            how pipelining really works — and whether you got it right!
          </p>
          <button className="cta-btn" onClick={onFinish}>
            Read the Blog Post →
          </button>
        </div>
      )}
    </section>
  );
}
