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

// Every instruction depends on the previous one (RAW chain).
// Each dependency adds 2 stall cycles + 1 pipeline slot = 3 extra cycles.
// Total: 5 + 3×(N−1) = 3N + 2 cycles.
function buildGridHazard(N) {
  const totalCycles = N === 1 ? 5 : 3 * N + 2;
  const S = (stage) => ({ stage, type: 'normal' });
  const STALL = () => ({ stage: 'stall', type: 'stall' });
  const grid = [];

  for (let i = 0; i < N; i++) {
    const row = new Array(totalCycles).fill(null);
    if (i === 0) {
      row[0] = S('IF'); row[1] = S('ID'); row[2] = S('EX'); row[3] = S('MEM'); row[4] = S('WB');
    } else {
      row[i] = S('IF');
      // Pipeline-backup stalls between IF and ID (stalled behind previous instruction)
      for (let c = i + 1; c < 3 * i - 1; c++) row[c] = STALL();
      // ID, then 2 RAW-hazard stalls, then EX → MEM → WB
      row[3 * i - 1] = S('ID');
      row[3 * i]     = STALL();
      row[3 * i + 1] = STALL();
      row[3 * i + 2] = S('EX');
      row[3 * i + 3] = S('MEM');
      row[3 * i + 4] = S('WB');
    }
    grid.push(row);
  }
  return { grid, totalCycles };
}

function buildGrid(mode, N) {
  if (mode === 'without') return buildGridWithout(N);
  if (mode === 'with')    return buildGridWith(N);
  return buildGridHazard(N);
}

// ── Instruction label helpers ──────────────────────────────────────
function makeInstructions(mode, N) {
  const vars = 'xabcdefghijklmnopqrst'.split('');
  const srcs = 'yzmnpqrstuvwABCDEFGHI'.split('');
  if (mode === 'hazard') {
    return Array.from({ length: N }, (_, i) => {
      const dst = vars[i % vars.length];
      if (i === 0) return `${dst} = ${srcs[0]} + ${srcs[1]};`;
      const prev = vars[(i - 1) % vars.length];
      return `${dst} = ${prev} - ${srcs[i + 1]};  ← uses ${prev}`;
    });
  }
  return Array.from({ length: N }, (_, i) => {
    const dst = vars[i % vars.length];
    const s1  = srcs[(i * 2) % srcs.length];
    const s2  = srcs[(i * 2 + 1) % srcs.length];
    return `${dst} = ${s1} + ${s2};`;
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
    const { grid } = buildGridHazard(N);
    const totalCycles = N === 1 ? 5 : 3 * N + 2;
    const active = [];
    let hasStall = false;
    for (let i = 0; i < N; i++) {
      const cell = grid[i][cycle];
      if (cell) {
        if (cell.type === 'stall') {
          active.push(`I${i + 1}→STALL`);
          hasStall = true;
        } else {
          active.push(`I${i + 1}→${cell.stage}`);
        }
      }
    }
    if (active.length === 0) return `Cycle ${c}: Pipeline empty.`;
    if (c === 1) return `Cycle 1: I1 enters the pipeline (IF). Pipeline filling up.`;
    if (c === totalCycles) return `Cycle ${c}: Pipeline drains. All ${N} instructions complete!`;
    const inFlight = active.length;
    let note = `Cycle ${c}: ${inFlight} instruction${inFlight > 1 ? 's' : ''} in-flight: ${active.join(', ')}.`;
    if (hasStall) note += ' RAW hazard — waiting for result.';
    return note;
  }
  return null;
}

// ── Stats panel ────────────────────────────────────────────────────
function StatsPanel({ N, mode }) {
  const withoutCycles = N * 5;
  const withCycles    = N + 4;
  const hazardCycles  = N === 1 ? 5 : 3 * N + 2;
  const maxBar        = mode === 'hazard' ? hazardCycles : withoutCycles;

  const rows = mode === 'hazard'
    ? [
        { label: 'With pipeline (no hazard)', cycles: withCycles, cls: 'with-bar' },
        { label: 'With pipeline (RAW hazard)', cycles: hazardCycles, cls: 'hazard-bar' },
      ]
    : [
        { label: 'Without pipeline', cycles: withoutCycles, cls: 'without-bar' },
        { label: 'With pipeline', cycles: withCycles, cls: 'with-bar' },
      ];

  const speedup = mode === 'hazard'
    ? (hazardCycles / withCycles).toFixed(2)
    : (withoutCycles / withCycles).toFixed(2);

  const formula = mode === 'hazard'
    ? `N+4 = ${withCycles}  |  3N+2 = ${hazardCycles}  |  ${hazardCycles - withCycles} stall cycles wasted`
    : `N×5 = ${withoutCycles}  |  N+4 = ${withCycles}  |  limit as N→∞ = 5×`;

  const badgeLabel = mode === 'hazard'
    ? `${speedup}× slowdown vs. no-hazard`
    : `${speedup}× speedup`;

  return (
    <div className="stats-panel">
      <h4 className="stats-title">Cycle Count Comparison  <span className="stats-n">N = {N} instruction{N !== 1 ? 's' : ''}</span></h4>

      {rows.map((r) => (
        <div className="stats-row" key={r.label}>
          <span className="stats-label">{r.label}</span>
          <div className="stats-bar-wrap">
            <div className={`stats-bar ${r.cls}`} style={{ width: `${Math.max((r.cycles / maxBar) * 100, 4)}%` }}>
              <span className="stats-bar-val">{r.cycles} cycles</span>
            </div>
          </div>
        </div>
      ))}

      <div className="stats-footer">
        <span className="speedup-badge">{badgeLabel}</span>
        <span className="stats-formula">{formula}</span>
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
  hazard:  (N) => `Pipelined (RAW hazard) — 5 + 3×(${N}−1) = ${N === 1 ? 5 : 3 * N + 2} cycles`,
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
  const compact = mode === 'without' ? N > 7 : mode === 'hazard' ? N > 7 : N > 14;
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
        <label className="n-slider-label">Instructions (N)</label>
        <input
          type="range"
          min={1}
          max={20}
          value={N}
          onChange={(e) => setN(parseInt(e.target.value))}
          className="scrubber n-scrubber"
        />
        <span className="n-value">{N}</span>
      </div>

      {/* ── Stats panel ── */}
      <StatsPanel N={N} mode={mode} />

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
