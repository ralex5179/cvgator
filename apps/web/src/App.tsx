const milestones = [
  'Spring Boot API scaffold under apps/api',
  'React + TypeScript + Vite scaffold under apps/web',
  'Template and Docker directories reserved for next milestones',
];

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">M1 Scaffold</p>
        <h1>CVGator foundation is in place.</h1>
        <p className="summary">
          Backend and frontend now share a clean starting point for template loading, HTML preview, and PDF export work.
        </p>
      </section>

      <section className="card">
        <h2>What this milestone adds</h2>
        <ul>
          {milestones.map((milestone) => (
            <li key={milestone}>{milestone}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
