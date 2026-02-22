const { body, validationResult } = require("express-validator");
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const Task = require("../models/Task");

// CREATE TASK
router.post(
  "/",
  protect,
  body("title").notEmpty().withMessage("Title is required"),
  async (req, res) => {
    try { // Fixed: Added missing try block
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description } = req.body;

      const task = await Task.create({
        title,
        description,
        user: req.user._id,
      });

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET ALL TASKS
router.get("/", protect, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE TASK
router.put("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Fixed: Compare strings to ensure the ID match works correctly
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    task.title = req.body.title ?? task.title;
    task.description = req.body.description ?? task.description;
    task.status = req.body.status ?? task.status;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE TASK
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Fixed: Compare strings
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await task.deleteOne();
    res.json({ message: "Task removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
