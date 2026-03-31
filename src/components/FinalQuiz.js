import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const questions = [
  {
    id: 1,
    text: 'Consider 3 independent instructions on a 5-stage pipeline (no hazards). How many cycles does it take?',
    code: 'x = y + z;\na = b - c;\np = q * r;',
    options: ['5', '7', '10', '15'],
    answer: '7',
    explanation:
      'With pipelining and no hazards: 5 + (N−1) = 5 + 2 = 7 cycles. Once the pipeline is full, one instruction completes every cycle.',
  },
  {
    id: 2,
    text: 'Now each instruction depends on the previous one (RAW hazard). How many cycles does it take?',
    code: 'x = y + z;\na = x - b;    // ← uses x\np = a * q;    // ← uses a',
    options: ['7', '9', '11', '15'],
    answer: '11',
    explanation:
      'Each RAW hazard inserts 2 stall cycles. Two hazards = 4 extra stall cycles. Base pipelined cost is 7, so total = 7 + 4 = 11 cycles.',
  },
  {
    id: 3,
    text: 'How many stall cycles does a back-to-back RAW dependency introduce in a 5-stage pipeline?',
    options: ['0', '1', '2', '3'],
    answer: '2',
    explanation:
      'Instruction A writes in WB (stage 5) but B needs the value at ID (stage 2 of B). With B starting one cycle after A, B\'s ID is at cycle 3, A\'s WB is at cycle 5 — 2 stall cycles are needed.',
  },
  {
    id: 4,
    text: 'What is a stall (bubble) in a pipeline?',
    options: [
      'An extra instruction inserted by the compiler',
      'A wasted cycle where no useful work happens in the stalled stage',
      'A stage that runs twice as fast to catch up',
      'A technique to reorder instructions automatically',
    ],
    answer:
      'A wasted cycle where no useful work happens in the stalled stage',
    explanation:
      'A stall (or bubble) is an empty slot inserted into the pipeline when a data hazard is detected. The dependent instruction waits, wasting a cycle, until the value it needs is available.',
  },
  {
    id: 5,
    text: 'A non-pipelined CPU takes how long compared to a fully pipelined one (no hazards, many instructions)?',
    options: [
      'About the same',
      'Roughly 2× slower',
      'Roughly 5× slower',
      'Roughly 10× slower',
    ],
    answer: 'Roughly 5× slower',
    explanation:
      'With N large, non-pipelined takes N×5 cycles vs. ≈N cycles for a 5-stage pipeline — roughly a 5× throughput difference.',
  },
];

export default function FinalQuiz() {
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? questions.filter((q) => selected[q.id] === q.answer).length
    : null;

  return (
    <section className="section">
      <div className="section-intro">
        <h2>Final Quiz</h2>
        <p>
          Let's see what you've learned. Select the best answer for each
          question, then hit <strong>Submit</strong>.
        </p>
      </div>

      {questions.map((q, idx) => {
        const isCorrect = submitted && selected[q.id] === q.answer;

        return (
          <div
            key={q.id}
            className={`quiz-card ${submitted ? (isCorrect ? 'card-correct' : 'card-incorrect') : ''}`}
          >
            <div className="quiz-card-header">
              <span className="quiz-number">Q{idx + 1}</span>
              <p className="question-text">{q.text}</p>
              {q.code && <pre className="code-block">{q.code}</pre>}
            </div>

            <div className="options">
              {q.options.map((opt) => {
                let cls = 'option-btn';
                if (submitted) {
                  if (opt === q.answer) cls += ' option-correct';
                  else if (opt === selected[q.id]) cls += ' option-wrong';
                } else if (selected[q.id] === opt) {
                  cls += ' option-selected';
                }
                return (
                  <button
                    key={opt}
                    className={cls}
                    onClick={() =>
                      !submitted && setSelected((s) => ({ ...s, [q.id]: opt }))
                    }
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                <span className="feedback-icon">{isCorrect ? '✓' : '✗'}</span>
                <div>
                  <strong>{isCorrect ? 'Correct!' : `Incorrect — "${q.answer}"`}</strong>
                  <p>{q.explanation}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {!submitted && (
        <div className="section-cta">
          <button
            className="cta-btn"
            onClick={() => {
              setSubmitted(true);
              const results = questions.map((q) => ({
                questionId: q.id,
                selected: selected[q.id],
                correct: selected[q.id] === q.answer,
              }));
              const score = results.filter((r) => r.correct).length;
              addDoc(collection(db, 'finalQuizResults'), {
                results,
                score,
                total: questions.length,
                timestamp: serverTimestamp(),
              }).catch(() => {});
            }}
            disabled={Object.keys(selected).length < questions.length}
          >
            Submit Answers
          </button>
          {Object.keys(selected).length < questions.length && (
            <p className="cta-note">
              Answer all {questions.length} questions to submit.
            </p>
          )}
        </div>
      )}

      {submitted && (
        <div className="score-card">
          <h3>
            Your score: {score} / {questions.length}
          </h3>
          <p>
            {score === questions.length
              ? 'Perfect! You have a solid understanding of pipelining.'
              : score >= 3
              ? 'Good job! Review the explanations above to fill in any gaps.'
              : 'Keep at it — re-read the blog post and try again!'}
          </p>
          <button
            className="cta-btn secondary"
            onClick={() => {
              setSelected({});
              setSubmitted(false);
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </section>
  );
}
