const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const protect = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "You accessed protected route", user: req.user });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
