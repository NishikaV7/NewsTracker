
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    author: { type: String, default: "Unknown" },
    content: { type: String, required: true },
    keywords: { type: [String], default: [] },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

articleSchema.index({ keywords: 1 });
const Article = mongoose.model("Article", articleSchema);

app.get("/api/health", (req, res) => {
  res.json({ message: "Backend connected successfully!" });
});

app.get("/api/articles", async (req, res) => {
  try {
    const filter = {};
    const { keyword, source } = req.query;

    if (keyword?.trim()) {
      const term = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { keywords: { $regex: term, $options: "i" } },
        { title: { $regex: term, $options: "i" } },
        { content: { $regex: term, $options: "i" } }
      ];
    }

    if (source && source !== "All Sources") {
      filter.source = source;
    }

    const articles = await Article.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 });

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/articles", async (req, res) => {
  try {
    const { title, source, author, content, keywords, publishedAt } = req.body;

    if (!title?.trim() || !source?.trim() || !content?.trim()) {
      return res.status(400).json({
        message: "Title, source and content are required."
      });
    }

    const normalizedKeywords = [
      ...new Set(
        (Array.isArray(keywords) ? keywords : [])
          .map(word => String(word).trim().toLowerCase())
          .filter(Boolean)
      )
    ];

    const article = await Article.create({
      title: title.trim(),
      source: source.trim(),
      author: author?.trim() || "Unknown",
      content: content.trim(),
      keywords: normalizedKeywords,
      ...(publishedAt ? { publishedAt } : {})
    });

    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments();
    const sources = await Article.distinct("source");
    const keywords = await Article.aggregate([
      { $unwind: "$keywords" },
      { $group: { _id: "$keywords", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 }
    ]);
    const allKeywords = await Article.distinct("keywords");

    res.json({
      totalArticles,
      totalSources: sources.length,
      totalKeywords: allKeywords.length,
      topKeywords: keywords.map(item => ({
        keyword: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/articles/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid article ID." });
    }

    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    res.json({ message: "Article deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error("MongoDB connection failed:", error.message);
  });