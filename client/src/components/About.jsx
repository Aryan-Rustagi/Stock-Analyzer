function About() {
  return (
    <section className="glass-panel" style={{padding: "4rem 3rem", textAlign: "center"}}>
      <div style={{marginBottom: "3rem"}}>
        <p style={{color: "var(--accent-primary)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600, margin: "0 0 1rem 0"}}>About Stock Analyzer</p>
        <h2 style={{fontSize: "2.5rem", marginBottom: "1rem"}}>Built for investors who value insight over noise.</h2>
        <p style={{maxWidth: "700px", margin: "0 auto", color: "var(--text-secondary)", fontSize: "1.1rem"}}>
          Stock Analyzer helps users explore the stock market with confidence. From company research to portfolio tracking, the experience is designed to make essential information clear, useful, and approachable.
        </p>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem"}}>
        <article className="glass-panel" style={{padding: "2rem", textAlign: "left"}}>
          <h3 style={{marginBottom: "1rem", color: "var(--accent-primary)", fontSize: "1.25rem"}}>Research made simple</h3>
          <p style={{color: "var(--text-secondary)"}}>Search companies and review market information in a clean, structured layout.</p>
        </article>
        <article className="glass-panel" style={{padding: "2rem", textAlign: "left"}}>
          <h3 style={{marginBottom: "1rem", color: "var(--accent-primary)", fontSize: "1.25rem"}}>Stay organized</h3>
          <p style={{color: "var(--text-secondary)"}}>Track your portfolio with thoughtful views that keep your focus on what matters.</p>
        </article>
        <article className="glass-panel" style={{padding: "2rem", textAlign: "left"}}>
          <h3 style={{marginBottom: "1rem", color: "var(--accent-primary)", fontSize: "1.25rem"}}>Invest with confidence</h3>
          <p style={{color: "var(--text-secondary)"}}>Make more informed decisions through a professional and dependable experience.</p>
        </article>
      </div>
    </section>
  );
}

export default About;