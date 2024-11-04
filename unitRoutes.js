//unitRoutes.js

const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("./sqlite");
const router = express.Router();

router.post(
  "/add-unit",
  [body("owner_id").isInt(), body("unit_number").notEmpty().isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { owner_id, unit_number } = req.body;
    try {
      await db.run("INSERT INTO units (owner_id, unit_number) VALUES (?, ?)", [
        owner_id,
        unit_number,
      ]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
router.get("/unit/:id", async (req, res) => {
  const unitId = req.params.id;
  try {
    const unit = await db.get("SELECT * FROM units WHERE id = ?", [unitId]);
    if (unit) {
      res.json({ success: true, unit });
    } else {
      res.status(404).json({ success: false, error: "Unit not found." });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
