const router = require("express").Router();
const Task = require("../models/Task");
const auth = require("../middleware/auth");
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch { res.status(500).json({ message: "Could not load tasks." }); }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ message: "Task title is required." });
    const task = await Task.create({
      user: req.user.id, title: String(title).trim(), description: description || "",
      priority: ["Low", "Medium", "High"].includes(priority) ? priority : "Medium",
      dueDate: dueDate || null
    });
    res.status(201).json(task);
  } catch { res.status(500).json({ message: "Could not create task." }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const allowed = {};
    ["title", "description", "priority", "status", "dueDate"].forEach(k => {
      if (req.body[k] !== undefined) allowed[k] = req.body[k] || null;
    });
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, allowed, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch { res.status(400).json({ message: "Could not update task. Check the values." }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted." });
  } catch { res.status(500).json({ message: "Could not delete task." }); }
});
module.exports = router;
