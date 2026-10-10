
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Backend connected successfully!" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
    app.listen(process.env.PORT || 5000, () => {
      console.log("Backend running at http://localhost:5000");
    });
  })
  .catch((err) => console.error("MongoDB error:", err.message));