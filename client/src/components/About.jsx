function About() {
  return (
    <section className="about-section">
      <div className="section-heading">
        <p className="eyebrow">About Stock Analyzer</p>
        <h2>Built for investors who value insight over noise.</h2>
      </div>

      <p>
        Stock Analyzer helps users explore the stock market with confidence. From company research to portfolio tracking, the experience is designed to make essential information clear, useful, and approachable for both new and experienced investors.
      </p>

      <div className="about-grid">
        <article>
          <h3>Research made simple</h3>
          <p>Search companies and review market information in a clean, structured layout.</p>
        </article>
        <article>
          <h3>Stay organized</h3>
          <p>Track your portfolio with thoughtful views that keep your focus on what matters.</p>
        </article>
        <article>
          <h3>Invest with confidence</h3>
          <p>Make more informed decisions through a professional and dependable experience.</p>
        </article>
      </div>
    </section>
  );
}

export default About;