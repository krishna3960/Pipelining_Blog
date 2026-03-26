import React, { useState } from 'react';
import PipelineVisual from './PipelineVisual';

export default function BlogPost({ onFinish }) {
  const [showPipeline, setShowPipeline] = useState('without');

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

        <h3>Interactive Diagram</h3>
        <p>Toggle between the two modes to see the difference:</p>

        <div className="toggle-row">
          <button
            className={showPipeline === 'without' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setShowPipeline('without')}
          >
            Without Pipeline
          </button>
          <button
            className={showPipeline === 'with' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setShowPipeline('with')}
          >
            With Pipeline (no hazard)
          </button>
          <button
            className={showPipeline === 'hazard' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setShowPipeline('hazard')}
          >
            With Pipeline (RAW hazard)
          </button>
        </div>

        <PipelineVisual mode={showPipeline} />

        <h3>Data Hazards (RAW)</h3>
        <p>
          A <strong>Read After Write (RAW)</strong> hazard occurs when an
          instruction needs a value that the previous instruction hasn't finished
          computing yet. Example:
        </p>
        <pre className="code-block">
{`ADD R1, R2, R3   ; writes R1 in WB stage (cycle 5)
SUB R4, R1, R5   ; needs R1 in ID stage (cycle 3) → 2-cycle stall`}
        </pre>
        <p>
          The pipeline must insert <strong>stall cycles (bubbles)</strong> —
          wasted slots where no useful work happens — until the value is ready.
          Without forwarding, a RAW hazard between back-to-back instructions
          costs <strong>2 stall cycles</strong> per dependency.
        </p>

        <h3>Forwarding (Bypassing)</h3>
        <p>
          Hardware can short-circuit the stall by forwarding the result directly
          from the EX/MEM output to the EX input of the dependent instruction,
          without waiting for WB. This eliminates most stalls — but not all
          (load-use hazards still need 1 stall cycle).
        </p>

        <div className="key-takeaway">
          <h4>Key Takeaways</h4>
          <ul>
            <li>Pipelining overlaps instruction execution to improve throughput.</li>
            <li>Without a pipeline: <strong>N × 5</strong> cycles for N instructions.</li>
            <li>With a pipeline (no hazards): <strong>5 + (N−1)</strong> cycles.</li>
            <li>RAW hazards introduce stall bubbles, reducing efficiency.</li>
            <li>Forwarding hardware removes most — but not all — stalls.</li>
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
