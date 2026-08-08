function About() {
  return (
    <section className="features-section">
      <h2>Built for clarity</h2>
      <p className="section-desc">
        A focused set of tools to help you research stocks, track your portfolio, and make informed decisions.
      </p>
      <div className="features-grid">
        <div className="feature-item">
          <h3>Search & Research</h3>
          <p>Look up any ticker symbol. View live quotes, price history, and key market data in a clean layout.</p>
        </div>
        <div className="feature-item">
          <h3>Portfolio Tracking</h3>
          <p>Save stocks to your watchlist. Monitor live prices across your holdings in one place.</p>
        </div>
        <div className="feature-item">
          <h3>Historical Charts</h3>
          <p>Visualize 30-day price trends with interactive charts. Spot patterns and track performance over time.</p>
        </div>
      </div>
    </section>
  );
}

export default About;