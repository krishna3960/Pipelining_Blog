import React, { useState } from 'react';

const questions = [
  {
    id: 1,
    title: 'No Data Dependency',
    code: `ADD R1, R2, R3   ; R1 = R2 + R3
SUB R4, R5, R6   ; R4 = R5 - R6
MUL R7, R8, R9   ; R7 = R8 * R9`,
    description:
      'A 5-stage pipeline (IF → ID → EX → MEM → WB). Each instruction takes 1 cycle per stage. These 3 instructions have NO dependency on each other.',
    question:
      'Assuming pipelining, how many cycles does it take to complete all 3 instructions?',
    hint: 'With a pipeline, instructions overlap. The first instruction takes 5 cycles to fill the pipeline, then each additional instruction adds just 1 more cycle.',
    answer: 7,
    explanation:
      'With pipelining and no hazards: 5 stages + (N−1) = 5 + 2 = 7 cycles. Once the pipeline is full, one instruction completes every cycle.',
  },
  {
    id: 2,
    title: 'Data Dependency (RAW Hazard)',
    code: `ADD R1, R2, R3   ; R1 = R2 + R3
SUB R4, R1, R5   ; R4 = R1 - R5  ← uses R1
MUL R6, R4, R7   ; R6 = R4 * R7  ← uses R4`,
    description:
      'Same 5-stage pipeline, no forwarding. Each instruction depends on the result of the previous one (Read After Write hazard). A dependent instruction must wait until the previous one reaches WB before it can proceed to EX.',
    question:
      'Assuming pipelining (no forwarding), how many cycles does it take to complete all 3 instructions?',
    hint: 'Each back-to-back RAW hazard stalls the pipeline for 2 cycles. There are 2 hazards here — how does that affect the total?',
    answer: 11,
    explanation:
      'With pipelining but no forwarding, each RAW hazard inserts 2 stall cycles. Two hazards = 4 extra stall cycles. Base pipelined cost is 7 cycles, so total = 7 + 4 = 11 cycles.',
  },
];

export default function QuizSection({ onFinish }) {
  const [answers, setAnswers] = useState({ 1: '', 2: '' });
  const [submitted, setSubmitted] = useState({ 1: false, 2: false });
  const [showHint, setShowHint] = useState({ 1: false, 2: false });

  const handleSubmit = (id) => {
    setSubmitted((s) => ({ ...s, [id]: true }));
  };

  const isCorrect = (id) => parseInt(answers[id]) === questions[id - 1].answer;

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

            <button
              className="hint-btn"
              onClick={() => setShowHint((h) => ({ ...h, [q.id]: !h[q.id] }))}
            >
              {showHint[q.id] ? 'Hide hint' : 'Show hint'}
            </button>
            {showHint[q.id] && <p className="hint">{q.hint}</p>}

            <div className="answer-row">
              <input
                type="number"
                className="answer-input"
                placeholder="cycles"
                value={answers[q.id]}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
                disabled={submitted[q.id]}
              />
              <span className="cycles-label">cycles</span>
              {!submitted[q.id] && (
                <button
                  className="submit-btn"
                  onClick={() => handleSubmit(q.id)}
                  disabled={!answers[q.id]}
                >
                  Check
                </button>
              )}
            </div>

            {submitted[q.id] && (
              <div className={`feedback ${isCorrect(q.id) ? 'correct' : 'incorrect'}`}>
                <span className="feedback-icon">
                  {isCorrect(q.id) ? '✓' : '✗'}
                </span>
                <div>
                  <strong>
                    {isCorrect(q.id) ? 'Correct!' : `Incorrect — the answer is ${q.answer}.`}
                  </strong>
                  <p>{q.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {submitted[1] && submitted[2] && (
        <div className="section-cta">
          <p>
            Notice the difference? No dependencies gave 7 cycles, but the RAW
            hazard chain pushed it to 11. Data dependencies cost real cycles in
            a pipeline — read on to understand exactly why.
          </p>
          <button className="cta-btn" onClick={onFinish}>
            Read the Blog Post →
          </button>
        </div>
      )}
    </section>
  );
}
