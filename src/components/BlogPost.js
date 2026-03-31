import React from 'react';
import PipelineVisual from './PipelineVisual';

export default function BlogPost({ onFinish }) {

  return (
    <section className="section blog">
      <h2>What is Pipelining?</h2>

      <div className="blog-body">
        <p>
          Modern CPUs execute instructions in multiple stages. A classic
          5-stage pipeline looks like this:
        </p>

        <div className="stage-list">
          {[
            ['IF', 'Instruction Fetch', 'Read the instruction from memory'],
            ['ID', 'Instruction Decode', 'Figure out what the instruction does'],
            ['EX', 'Execute', 'Perform the computation (ALU)'],
            ['MEM', 'Memory Access', 'Read or write data memory'],
            ['WB', 'Write Back', 'Store the result in a register'],
          ].map(([abbr, name, desc]) => (
            <div key={abbr} className="stage-item">
              <span className="stage-badge">{abbr}</span>
              <div>
                <strong>{name}</strong>
                <span className="stage-desc"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>

        <h3>Without a Pipeline</h3>
        <p>
          On a non-pipelined processor, one instruction must finish{' '}
          <em>all five stages</em> before the next one can even start. It's like
          a single-lane car wash: the next car waits outside until the first car
          has been washed, rinsed, and dried.
        </p>
        <p>
          For <strong>N instructions</strong>, this takes{' '}
          <strong>N × 5 cycles</strong>.
        </p>

        <h3>With a Pipeline</h3>
        <p>
          Pipelining overlaps execution: while instruction 1 is in the EX stage,
          instruction 2 is in ID and instruction 3 is being fetched. Like a
          multi-station car wash — every station is always busy.
        </p>
        <p>
          For <strong>N instructions</strong> with no hazards, a pipeline
          finishes in just <strong>5 + (N − 1) cycles</strong> — a dramatic
          speedup for long sequences.
        </p>

        <div className="how-to-use">
          <h4>How to use the diagrams</h4>
          <ul>
            <li>Press <strong>Play</strong> to animate the pipeline cycle by cycle, or <strong>Step</strong> to advance one cycle at a time.</li>
            <li>Drag the <strong>scrubber</strong> to jump to any cycle.</li>
            <li>Use the <strong>Instructions (N)</strong> slider to change how many instructions run through the pipeline.</li>
            <li>The <strong>bar chart</strong> updates live to compare cycle counts.</li>
            <li>You can modify speed by choosing slow/normal/fast on the top right</li>
          </ul>
        </div>

        <h3>1. Without a Pipeline — Interactive</h3>
        <p>
          Each instruction completes all 5 stages before the next one begins.
          Use the controls below to step through the execution:
        </p>
        <PipelineVisual mode="without" />

        <h3>2. With a Pipeline (No Hazard) — Interactive</h3>
        <p>
          Now instructions overlap — while one is executing, the next is already
          being decoded. Compare the cycle count with the sequential version above:
        </p>
        <PipelineVisual mode="with" />

        <h3>Data Hazards (RAW)</h3>
        <p>
          A <strong>Read After Write (RAW)</strong> hazard occurs when an
          instruction needs a value that the previous instruction hasn't finished
          computing yet. Example:
        </p>
        <pre className="code-block">
{`x = y + z;       // writes x in WB stage (cycle 5)
a = x - b;       // needs x in ID stage (cycle 3) → 2-cycle stall
p = a * q;       // needs a from previous → 2 more stall cycles`}
        </pre>
        <p>
          The pipeline must insert <strong>stall cycles (bubbles)</strong> —
          wasted slots where no useful work happens — until the value is ready.
          A RAW hazard between back-to-back instructions
          costs <strong>2 stall cycles</strong> per dependency. With two
          chained hazards, 4 total stall cycles are inserted (7 + 4 = 11 cycles).
        </p>

        <h3>3. With a Pipeline (RAW Hazard) — Interactive</h3>
        <p>
          Now see it in action — when an instruction depends on the result of
          the previous one, the pipeline must stall:
        </p>
        <PipelineVisual mode="hazard" />

        <div className="key-takeaway">
          <h4>Key Takeaways</h4>
          <ul>
            <li>Pipelining overlaps instruction execution to improve throughput.</li>
            <li>Without a pipeline: <strong>N × 5</strong> cycles for N instructions.</li>
            <li>With a pipeline (no hazards): <strong>5 + (N−1)</strong> cycles.</li>
            <li>RAW hazards introduce stall bubbles, reducing efficiency.</li>
          </ul>
        </div>
      </div>

      <div className="section-cta">
        <button className="cta-btn" onClick={onFinish}>
          Take the Final Quiz →
        </button>
      </div>
    </section>
  );
}
