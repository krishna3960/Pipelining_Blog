import React, { useState } from 'react';
import './App.css';
import QuizSection from './components/QuizSection';
import BlogPost from './components/BlogPost';
import FinalQuiz from './components/FinalQuiz';

const STEPS = [
  { id: 'quiz',  label: 'Warm-Up Quiz',    num: '01' },
  { id: 'blog',  label: 'Learn Pipelining', num: '02' },
  { id: 'final', label: 'Final Quiz',       num: '03' },
];

function App() {
  const [activeSection, setActiveSection] = useState('quiz');

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <div className="header-brand">
            <span className="brand-tag">CS Architecture</span>
            <h1 className="brand-title">CPU Pipelining</h1>
          </div>
          <p className="header-desc">
            How overlapping instruction execution multiplies throughput
          </p>
        </div>
        <nav className="nav">
          {STEPS.map((step) => (
            <button
              key={step.id}
              className={activeSection === step.id ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setActiveSection(step.id)}
            >
              <span className="nav-num">{step.num}</span>
              <span className="nav-label">{step.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="main-content">
        {activeSection === 'quiz'  && <QuizSection onFinish={() => setActiveSection('blog')} />}
        {activeSection === 'blog'  && <BlogPost    onFinish={() => setActiveSection('final')} />}
        {activeSection === 'final' && <FinalQuiz />}
      </main>

      <footer className="app-footer">
        Computer Architecture · ETH Zürich
      </footer>
    </div>
  );
}

export default App;
