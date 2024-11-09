// unitRoutes.js

const express = require("express");
const { validationResult } = require("express-validator");
const db = require("./sqlite");
const { authMiddleware } = require("./middleware");
const { unitValidationRules } = require('./js/core/validation');
const router = express.Router();

// Add a new unit (protected route)
router.post("/add-unit", authMiddleware, unitValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { owner_id, unit_number, floor, is_rented, tenant_id } = req.body;
  try {
    await db.dbRun(
      "INSERT INTO units (owner_id, unit_number, floor, is_rented, tenant_id, last_updated) VALUES (?, ?, ?, ?, ?, ?)",
      [owner_id, unit_number, floor, is_rented || false, tenant_id || null, new Date().toISOString()]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding unit:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a unit by ID
router.get("/unit/:id", authMiddleware, async (req, res) => {
  const unitId = req.params.id;
  try {
    const unit = await db.dbQuery("SELECT * FROM units WHERE unit_id = ?", [unitId]);
    if (unit.length > 0) {
      res.json({ success: true, unit: unit[0] });
    } else {
      res.status(404).json({ success: false, error: "Unit not found." });
    }
  } catch (error) {
    console.error("Error fetching unit:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a unit (protected route)
router.put("/update-unit/:id", authMiddleware, unitValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const unitId = req.params.id;
  const { owner_id, unit_number, floor, is_rented, tenant_id } = req.body;
  try {
    await db.dbRun(
      "UPDATE units SET owner_id = COALESCE(?, owner_id), unit_number = COALESCE(?, unit_number), floor = COALESCE(?, floor), is_rented = COALESCE(?, is_rented), tenant_id = COALESCE(?, tenant_id), last_updated = ? WHERE unit_id = ?",
      [owner_id, unit_number, floor, is_rented, tenant_id, new Date().toISOString(), unitId]
    );
    res.json({ success: true, message: "Unit updated successfully." });
  } catch (error) {
    console.error("Error updating unit:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a unit (protected route)
router.delete("/delete-unit/:id", authMiddleware, async (req, res) => {
  const unitId = req.params.id;
  try {
    await db.dbRun("DELETE FROM units WHERE unit_id = ?", [unitId]);
    res.json({ success: true, message: "Unit deleted successfully." });
  } catch (error) {
    console.error("Error deleting unit:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;