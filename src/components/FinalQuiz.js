import React, { useState } from 'react';

const questions = [
  {
    id: 1,
    text: 'A 5-stage pipeline executes 8 independent instructions (no hazards). How many cycles does it take?',
    options: ['40', '12', '13', '8'],
    answer: '12',
    explanation:
      'With a pipeline and no hazards: 5 + (N−1) = 5 + 7 = 12 cycles.',
  },
  {
    id: 2,
    text: 'What is a RAW (Read After Write) hazard?',
    options: [
      'Two instructions write to the same register simultaneously',
      'An instruction reads a register before a previous instruction has finished writing it',
      'An instruction is fetched from the wrong memory address',
      'A write happens before a dependent read in out-of-order execution',
    ],
    answer:
      'An instruction reads a register before a previous instruction has finished writing it',
    explanation:
      'RAW is the most common hazard: instruction B needs a value that instruction A hasn\'t written back yet.',
  },
  {
    id: 3,
    text: 'How many stall cycles does a back-to-back RAW dependency introduce in a 5-stage pipeline WITHOUT forwarding?',
    options: ['0', '1', '2', '3'],
    answer: '2',
    explanation:
      'Without forwarding, instruction A writes in WB (stage 5) but B needs the value at ID (stage 2 of B). With B starting one cycle after A, B\'s ID is at cycle 3, A\'s WB is at cycle 5 — 2 stall cycles are needed.',
  },
  {
    id: 4,
    text: 'What does forwarding (bypassing) accomplish?',
    options: [
      'It eliminates all pipeline stalls',
      'It routes a computed result directly to a later stage without waiting for WB',
      'It reorders instructions to avoid hazards',
      'It duplicates the ALU to run two instructions at once',
    ],
    answer:
      'It routes a computed result directly to a later stage without waiting for WB',
    explanation:
      'Forwarding feeds the EX output back to the EX input of a dependent instruction, bypassing the WB stage and eliminating most (but not all) stalls.',
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
            onClick={() => setSubmitted(true)}
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
