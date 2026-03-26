import React, { useState, useEffect, useRef } from 'react';

const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];
const STAGE_COLORS = {
  IF: '#6366f1',
  ID: '#8b5cf6',
  EX: '#ec4899',
  MEM: '#f97316',
  WB: '#10b981',
  stall: '#475569',
};

// ── Grid builders ─────────────────────────────────────────────────
function buildGridWithout(N) {
  const totalCycles = N * 5;
  const grid = [];
  for (let i = 0; i < N; i++) {
    const row = new Array(totalCycles).fill(null);
    const offset = i * 5;
    for (let s = 0; s < 5; s++) row[offset + s] = { stage: STAGES[s], type: 'normal' };
    grid.push(row);
  }
  return { grid, totalCycles };
}

function buildGridWith(N) {
  const totalCycles = N + 4;
  const grid = [];
  for (let i = 0; i < N; i++) {
    const row = new Array(totalCycles).fill(null);
    for (let s = 0; s < 5; s++) {
      if (i + s < totalCycles) row[i + s] = { stage: STAGES[s], type: 'normal' };
    }
    grid.push(row);
  }
  return { grid, totalCycles };
}

// Fixed 2-instruction RAW hazard example
function buildGridHazard() {
  const totalCycles = 9;
  const grid = [
    [
      { stage: 'IF', type: 'normal' },
      { stage: 'ID', type: 'normal' },
      { stage: 'EX', type: 'normal' },
      { stage: 'MEM', type: 'normal' },
      { stage: 'WB', type: 'normal' },
      null, null, null, null,
    ],
    [
      null,
      { stage: 'IF', type: 'normal' },
      { stage: 'ID', type: 'normal' },
      { stage: 'stall', type: 'stall' },
      { stage: 'stall', type: 'stall' },
      { stage: 'EX', type: 'normal' },
      { stage: 'MEM', type: 'normal' },
      { stage: 'WB', type: 'normal' },
      null,
    ],
  ];
  return { grid, totalCycles };
}

function buildGrid(mode, N) {
  if (mode === 'without') return buildGridWithout(N);
  if (mode === 'with')    return buildGridWith(N);
  return buildGridHazard();
}

// ── Instruction label helpers ──────────────────────────────────────
function makeInstructions(mode, N) {
  if (mode === 'hazard') {
    return ['ADD R1, R2, R3', 'SUB R4, R1, R5  ← needs R1'];
  }
  const ops  = ['ADD','SUB','MUL','AND','OR','XOR','SLL','SRL','SLT','LW'];
  return Array.from({ length: N }, (_, i) => {
    const op  = ops[i % ops.length];
    const dst = `R${i * 3 + 1}`;
    const s1  = `R${i * 3 + 2}`;
    const s2  = `R${i * 3 + 3}`;
    return `${op} ${dst}, ${s1}, ${s2}`;
  });
}

// ── Cycle notes ────────────────────────────────────────────────────
function getCycleNote(mode, cycle, N) {
  if (cycle === null) return null;
  const c = cycle + 1;

  if (mode === 'without') {
    const instrIdx = Math.floor(cycle / 5);
    const stageIdx = cycle % 5;
    const waiting  = N - instrIdx - 1;
    return `Cycle ${c}: I${instrIdx + 1} is in the ${STAGES[stageIdx]} stage.` +
           (waiting > 0 ? ` ${waiting} instruction${waiting > 1 ? 's' : ''} still waiting.` : ' Last instruction!');
  }

  if (mode === 'with') {
    const totalCycles = N + 4;
    // Which instructions are active this cycle?
    const active = [];
    for (let i = 0; i < N; i++) {
      const stageIdx = c - 1 - i;
      if (stageIdx >= 0 && stageIdx < 5) active.push(`I${i + 1}→${STAGES[stageIdx]}`);
    }
    const inFlight = active.length;
    if (c === 1) return `Cycle 1: I1 enters the pipeline (IF). Pipeline filling up.`;
    if (c <= 5)  return `Cycle ${c}: ${inFlight} instruction${inFlight > 1 ? 's' : ''} in-flight simultaneously: ${active.join(', ')}.`;
    if (c === totalCycles) return `Cycle ${c}: Pipeline drains. All ${N} instructions complete!`;
    return `Cycle ${c}: ${inFlight} instruction${inFlight > 1 ? 's' : ''} in-flight: ${active.join(', ')}.`;
  }

  if (mode === 'hazard') {
    const notes = [
      'Cycle 1: I1 fetched (IF).',
      'Cycle 2: I1 → ID, I2 fetched (IF).',
      'Cycle 3: I1 → EX. I2 finishes decode (ID) but needs R1 — stall!',
      'Cycle 4: STALL — I2 waits. I1 is in MEM, R1 not written yet.',
      'Cycle 5: STALL — I2 still waits. I1 writes R1 in WB this cycle.',
      'Cycle 6: R1 is ready! I2 finally enters EX.',
      'Cycle 7: I2 → MEM.',
      'Cycle 8: I2 → WB. Done!',
      'Cycle 9: Pipeline drained.',
    ];
    return notes[cycle] || null;
  }
  return null;
}

// ── Stats panel ────────────────────────────────────────────────────
function StatsPanel({ N }) {
  const withoutCycles = N * 5;
  const withCycles    = N + 4;
  const speedup       = (withoutCycles / withCycles).toFixed(2);
  const maxBar        = withoutCycles;
  const pctWith       = (withCycles / maxBar) * 100;

  return (
    <div className="stats-panel">
      <h4 className="stats-title">Cycle Count Comparison  <span className="stats-n">N = {N} instruction{N !== 1 ? 's' : ''}</span></h4>

      <div className="stats-row">
        <span className="stats-label">Without pipeline</span>
        <div className="stats-bar-wrap">
          <div className="stats-bar without-bar" style={{ width: '100%' }}>
            <span className="stats-bar-val">{withoutCycles} cycles</span>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <span className="stats-label">With pipeline</span>
        <div className="stats-bar-wrap">
          <div className="stats-bar with-bar" style={{ width: `${Math.max(pctWith, 4)}%` }}>
            <span className="stats-bar-val">{withCycles} cycles</span>
          </div>
        </div>
      </div>

      <div className="stats-footer">
        <span className="speedup-badge">{speedup}× speedup</span>
        <span className="stats-formula">
          N×5 = {withoutCycles} &nbsp;|&nbsp; N+4 = {withCycles} &nbsp;|&nbsp; limit as N→∞ = 5×
        </span>
      </div>
    </div>
  );
}

// ── Constants ──────────────────────────────────────────────────────
const SPEED_OPTIONS = [
  { label: 'Slow',   ms: 1200 },
  { label: 'Normal', ms: 700  },
  { label: 'Fast',   ms: 300  },
];

const MODE_LABELS = {
  without: (N) => `No Pipeline — ${N} instruction${N !== 1 ? 's' : ''} × 5 stages = ${N * 5} cycles`,
  with:    (N) => `Pipelined (no hazard) — 5 + (${N}−1) = ${N + 4} cycles`,
  hazard:  ()  => 'Pipelined (RAW hazard) — 2 stall bubbles inserted = 9 cycles',
};

// ── Component ──────────────────────────────────────────────────────
export default function PipelineVisual({ mode }) {
  const [N, setN] = useState(3);
  const [currentCycle, setCurrentCycle] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const intervalRef = useRef(null);

  const { grid, totalCycles } = buildGrid(mode, N);
  const instructions = makeInstructions(mode, N);

  // Compact cells when table would be very wide
  const compact = mode === 'without' ? N > 7 : N > 14;
  const cellSize = compact ? 28 : 42;

  // Reset animation when mode or N changes
  useEffect(() => {
    setCurrentCycle(null);
    setPlaying(false);
  }, [mode, N]);

  // Auto-advance
  useEffect(() => {
    if (!playing) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setCurrentCycle((prev) => {
        const next = prev === null ? 0 : prev + 1;
        if (next >= totalCycles) { setPlaying(false); return totalCycles - 1; }
        return next;
      });
    }, SPEED_OPTIONS[speedIdx].ms);
    return () => clearInterval(intervalRef.current);
  }, [playing, speedIdx, totalCycles]);

  const handlePlay  = () => {
    if (currentCycle !== null && currentCycle >= totalCycles - 1) setCurrentCycle(0);
    setPlaying(true);
  };
  const handlePause = () => setPlaying(false);
  const handleReset = () => { setPlaying(false); setCurrentCycle(null); };
  const handleStep  = () => {
    setPlaying(false);
    setCurrentCycle((prev) => {
      if (prev === null) return 0;
      return Math.min(prev + 1, totalCycles - 1);
    });
  };
  const handleScrub = (e) => { setPlaying(false); setCurrentCycle(parseInt(e.target.value)); };

  const cycleNums = Array.from({ length: totalCycles }, (_, i) => i + 1);
  const note      = getCycleNote(mode, currentCycle, N);
  const progress  = currentCycle === null ? 0 : ((currentCycle + 1) / totalCycles) * 100;

  return (
    <div className="pipeline-visual">
      <p className="visual-label">{MODE_LABELS[mode](N)}</p>

      {/* ── N slider ── */}
      <div className="n-slider-row">
        <label className="n-slider-label">
          Instructions (N)
          {mode === 'hazard' && <span className="n-slider-locked"> — fixed example</span>}
        </label>
        <input
          type="range"
          min={1}
          max={20}
          value={N}
          onChange={(e) => setN(parseInt(e.target.value))}
          disabled={mode === 'hazard'}
          className="scrubber n-scrubber"
        />
        <span className="n-value">{mode === 'hazard' ? 2 : N}</span>
      </div>

      {/* ── Stats panel (not for hazard fixed example) ── */}
      {mode !== 'hazard' && <StatsPanel N={N} />}

      {/* ── Playback controls ── */}
      <div className="anim-controls">
        <div className="anim-buttons">
          {!playing ? (
            <button className="anim-btn play"  onClick={handlePlay}>▶ Play</button>
          ) : (
            <button className="anim-btn pause" onClick={handlePause}>⏸ Pause</button>
          )}
          <button className="anim-btn step"  onClick={handleStep}
            disabled={currentCycle !== null && currentCycle >= totalCycles - 1}>
            ⏭ Step
          </button>
          <button className="anim-btn reset" onClick={handleReset}>↺ Reset</button>
        </div>
        <div className="speed-select">
          {SPEED_OPTIONS.map((s, i) => (
            <button key={s.label}
              className={i === speedIdx ? 'speed-btn active' : 'speed-btn'}
              onClick={() => setSpeedIdx(i)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cycle scrubber ── */}
      <div className="scrubber-row">
        <span className="scrubber-label">C1</span>
        <input type="range" min={0} max={totalCycles - 1}
          value={currentCycle ?? 0} onChange={handleScrub} className="scrubber" />
        <span className="scrubber-label">C{totalCycles}</span>
        <span className="cycle-counter">
          {currentCycle === null ? '—' : `Cycle ${currentCycle + 1} / ${totalCycles}`}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Pipeline table ── */}
      <div className="pipeline-scroll">
        <table className="pipeline-table" style={{ borderSpacing: compact ? '2px' : '3px' }}>
          <thead>
            <tr>
              <th className="instr-col">Instruction</th>
              {cycleNums.map((c, ci) => (
                <th key={c} style={{ minWidth: cellSize, padding: compact ? '2px' : undefined }}
                  className={`cycle-col ${ci === currentCycle ? 'cycle-active-header' : ''}`}>
                  {compact ? c : `C${c}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, ri) => (
              <tr key={ri}>
                <td className="instr-label" style={{ fontSize: compact ? '0.72rem' : undefined }}>
                  {instructions[ri]}
                </td>
                {row.map((cell, ci) => {
                  const revealed  = currentCycle !== null && ci <= currentCycle;
                  const isCurrent = ci === currentCycle;
                  const isStall   = cell?.type === 'stall';
                  return (
                    <td key={ci}
                      className={[
                        'pipeline-cell',
                        revealed && cell ? 'cell-revealed' : '',
                        isCurrent && cell ? 'cell-current' : '',
                        isCurrent && isStall ? 'cell-stall-pulse' : '',
                      ].join(' ')}
                      style={{
                        width: cellSize,
                        height: compact ? 28 : 36,
                        backgroundColor: revealed && cell ? STAGE_COLORS[cell.stage] : 'transparent',
                        opacity: revealed ? 1 : 0,
                        transform: isCurrent && cell ? 'scale(1.1)' : 'scale(1)',
                      }}>
                      {revealed && cell && (
                        <span className="stage-text" style={{ fontSize: compact ? '0.6rem' : undefined }}>
                          {isStall ? '—' : cell.stage}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Cycle note ── */}
      <div className={`cycle-note ${note ? 'cycle-note-visible' : ''}`}>
        {note || '\u00A0'}
      </div>

      {/* ── Legend ── */}
      <div className="legend">
        {STAGES.map((s) => (
          <span key={s} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: STAGE_COLORS[s] }} />{s}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: STAGE_COLORS.stall }} />Stall
        </span>
      </div>
    </div>
  );
}
