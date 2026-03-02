const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("Nova Plus Backend is Running 🚀");
});

// AI Chat Route (Bayojid AI placeholder)
app.post("/api/chat", (req, res) => {
  const { message } = req.body;

  res.json({
    reply: `Bayojid AI received: ${message}`
  });
});

// Server Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
