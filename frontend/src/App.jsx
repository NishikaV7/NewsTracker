
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const emptyForm = {
  title: "",
  source: "",
  author: "",
  content: "",
  keywords: "",
  publishedAt: new Date().toISOString().slice(0, 10)
};

function App() {
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalSources: 0,
    topKeywords: []
  });
  const [keyword, setKeyword] = useState("");
  const [source, setSource] = useState("All Sources");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (source !== "All Sources") params.set("source", source);

      const [articleResponse, statsResponse] = await Promise.all([
        fetch(`${API}/articles?${params.toString()}`),
        fetch(`${API}/stats`)
      ]);

      if (!articleResponse.ok || !statsResponse.ok) {
        throw new Error("Could not load data from the server.");
      }

      const [articleData, statsData] = await Promise.all([
        articleResponse.json(),
        statsResponse.json()
      ]);

      setArticles(articleData);
      setStats(statsData);
    } catch (err) {
      setError(
        "Unable to connect to the backend. Check that MongoDB and the backend server are running."
      );
    } finally {
      setLoading(false);
    }
  }, [keyword, source]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddArticle(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      keywords: form.keywords
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean)
    };

    try {
      const response = await fetch(`${API}/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add article.");
      }

      setForm(emptyForm);
      setShowForm(false);
      setKeyword("");
      setSource("All Sources");
      setMessage("Article added successfully!");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to add article.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this news article?")) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/articles/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete article.");
      }

      setMessage("Article deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete article.");
    }
  }

  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  }

  const sources = [
    "All Sources",
    ...new Set(articles.map((article) => article.source))
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="NewsTrack home">
          <span className="brand-icon">N</span>
          <span>News<span className="brand-accent">Track</span></span>
        </a>
        <span className="live-label">
          <span className="live-dot" /> MONGODB CONNECTED APP
        </span>
      </header>

      <main className="dashboard">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">YOUR PERSONAL NEWS MONITOR</p>
            <h1>Follow the words<br />shaping <span>the world.</span></h1>
            <p className="hero-description">
              Track topics, discover matching articles, and see
              which keywords appear most across your news collection.
            </p>
            <button
              className="primary-button"
              onClick={() => {
                setShowForm(!showForm);
                setMessage("");
                setError("");
              }}
            >
              {showForm ? "Close form" : "+ Add news article"}
            </button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="news-symbol">N<span>.</span></div>
            <span className="floating-tag tag-one">AI</span>
            <span className="floating-tag tag-two">TECH</span>
            <span className="floating-tag tag-three">WORLD</span>
          </div>
        </section>

        {error && <div className="notice error-notice">{error}</div>}
        {message && <div className="notice success-notice">{message}</div>}

        {showForm && (
          <section className="panel form-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">CONTRIBUTE TO YOUR FEED</p>
                <h2>Add a news article</h2>
              </div>
            </div>

            <form onSubmit={handleAddArticle} className="article-form">
              <label>
                Article title *
                <input
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="Enter the headline"
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  News source *
                  <input
                    name="source"
                    value={form.source}
                    onChange={updateField}
                    placeholder="e.g. The Hindu"
                    required
                  />
                </label>
                <label>
                  Author
                  <input
                    name="author"
                    value={form.author}
                    onChange={updateField}
                    placeholder="Author name"
                  />
                </label>
              </div>

              <label>
                Publication date
                <input
                  type="date"
                  name="publishedAt"
                  value={form.publishedAt}
                  onChange={updateField}
                />
              </label>

              <label>
                Keywords * (separate with commas)
                <input
                  name="keywords"
                  value={form.keywords}
                  onChange={updateField}
                  placeholder="AI, technology, healthcare"
                  required
                />
              </label>

              <label>
                Article content *
                <textarea
                  name="content"
                  value={form.content}
                  onChange={updateField}
                  placeholder="Paste or write a short news summary..."
                  rows="4"
                  required
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save article"}
              </button>
            </form>
          </section>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon purple">▤</span>
            <p>Total articles</p>
            <strong>{stats.totalArticles}</strong>
            <small>Stored in MongoDB</small>
          </div>
          <div className="stat-card">
            <span className="stat-icon orange">#</span>
            <p>Tracked keywords</p>
            <strong>{stats.topKeywords.length}</strong>
            <small>Top keywords shown below</small>
          </div>
          <div className="stat-card">
            <span className="stat-icon green">◎</span>
            <p>News sources</p>
            <strong>{stats.totalSources}</strong>
            <small>Distinct publishers</small>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel articles-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE LATEST COLLECTION</p>
                <h2>News articles</h2>
              </div>
              <span className="result-count">{articles.length} results</span>
            </div>

            <div className="search-controls">
              <div className="search-box">
                <span>⌕</span>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Search keywords, titles or content..."
                  aria-label="Search articles"
                />
                {keyword && (
                  <button
                    className="clear-search"
                    onClick={() => setKeyword("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                aria-label="Filter by source"
              >
                {sources.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="empty-state">
                <span className="spinner" />
                <p>Loading your news collection...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">⌕</span>
                <h3>No articles found</h3>
                <p>Try another keyword or add your first article.</p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setKeyword("");
                    setSource("All Sources");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="article-list">
                {articles.map((article) => (
                  <article className="article-card" key={article._id}>
                    <div className="article-topline">
                      <span className="source-label">{article.source}</span>
                      <span className="article-date">
                        {new Date(article.publishedAt).toLocaleDateString(
                          undefined,
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </span>
                    </div>
                    <h3>{article.title}</h3>
                    <p className="article-content">{article.content}</p>

                    <div className="keyword-list">
                      {article.keywords.map((word) => (
                        <button
                          className={
                            keyword.toLowerCase() === word.toLowerCase()
                              ? "keyword-chip selected-chip"
                              : "keyword-chip"
                          }
                          key={word}
                          onClick={() => setKeyword(word)}
                          title={`Search for ${word}`}
                        >
                          #{word}
                        </button>
                      ))}
                    </div>

                    <div className="article-footer">
                      <span>By {article.author || "Unknown"}</span>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(article._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="panel trends-panel">
            <p className="eyebrow">WHAT'S BEING MENTIONED</p>
            <h2>Keyword trends</h2>
            <p className="muted">
              Ranked by the number of stored articles containing each keyword.
            </p>

            {stats.topKeywords.length === 0 ? (
              <div className="small-empty">
                Add articles to discover your keyword trends.
              </div>
            ) : (
              <div className="trend-list">
                {stats.topKeywords.map((item, index) => {
                  const maximum = stats.topKeywords[0].count || 1;
                  return (
                    <button
                      className="trend-item"
                      key={item.keyword}
                      onClick={() => setKeyword(item.keyword)}
                      title={`Search for ${item.keyword}`}
                    >
                      <div className="trend-line">
                        <span className="trend-rank">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="trend-name">#{item.keyword}</span>
                        <span className="trend-count">{item.count}</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(item.count / maximum) * 100}%`
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="trend-tip">
              <span>✦</span>
              <div>
                <strong>Explore a trend</strong>
                <p>Select any keyword above to find matching articles.</p>
              </div>
            </div>
          </aside>
        </section>

        <footer className="footer">
          <span>NewsTrack · News Article Keyword Tracker</span>
          <span>Powered by React, Express & MongoDB</span>
        </footer>
      </main>
    </div>
  );
}

export default App;