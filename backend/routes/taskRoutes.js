const express = require("express");
const mongoose = require("mongoose");
const protect = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const Category = require("../models/Category");

const router = express.Router();
const VALID_STATUSES = new Set(["pending", "completed"]);

const normalizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const resolveCategory = async (rawCategory, userId) => {
  if (rawCategory === null || rawCategory === "") {
    return { value: null };
  }

  if (!mongoose.Types.ObjectId.isValid(rawCategory)) {
    return { error: "Invalid category id" };
  }

  const category = await Category.findOne({
    _id: rawCategory,
    user: userId,
  }).select("_id");

  if (!category) {
    return { error: "Category not found" };
  }

  return { value: category._id };
};

router.post("/", protect, async (req, res) => {
  try {
    const trimmedTitle = normalizeText(req.body.title);
    const trimmedDescription = normalizeText(req.body.description);

    if (!trimmedTitle) {
      return res.status(400).json({ message: "Title is required" });
    }

    let categoryValue = null;
    if (req.body.category !== undefined) {
      const categoryResolution = await resolveCategory(req.body.category, req.user);
      if (categoryResolution.error) {
        return res.status(400).json({ message: categoryResolution.error });
      }
      categoryValue = categoryResolution.value;
    }

    const task = await Task.create({
      title: trimmedTitle,
      description: trimmedDescription,
      user: req.user,
      category: categoryValue,
    });

    const populatedTask = await Task.findById(task._id).populate("category", "name");
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.user.toString() !== req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (req.body.title !== undefined) {
      const nextTitle = normalizeText(req.body.title);
      if (!nextTitle) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      task.title = nextTitle;
    }

    if (req.body.description !== undefined) {
      task.description = normalizeText(req.body.description);
    }

    if (req.body.status !== undefined) {
      if (!VALID_STATUSES.has(req.body.status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      task.status = req.body.status;
    }

    if (req.body.category !== undefined) {
      const categoryResolution = await resolveCategory(req.body.category, req.user);
      if (categoryResolution.error) {
        return res.status(400).json({ message: categoryResolution.error });
      }
      task.category = categoryResolution.value;
    }

    await task.save();
    await task.populate("category", "name");

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.user.toString() !== req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await task.deleteOne();

    res.json({ message: "Task removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
