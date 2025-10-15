const express = require("express");
const CreditReport = require("../models/CreditReport");

const router = express.Router();

// GET /api/reports - Get all credit reports
router.get("/", async (req, res) => {
  try {
    const reports = await CreditReport.find()
      .sort({ createdAt: -1 })
      .select(
        "basicDetails.name basicDetails.creditScore fileName uploadedAt _id"
      );

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
});

// GET /api/reports/:id - Get specific credit report
router.get("/:id", async (req, res) => {
  try {
    const report = await CreditReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Credit report not found",
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("❌ Error fetching report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report",
    });
  }
});

// DELETE /api/reports/:id - Delete credit report
router.delete("/:id", async (req, res) => {
  try {
    const report = await CreditReport.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Credit report not found",
      });
    }

    res.json({
      success: true,
      message: "Credit report deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete report",
    });
  }
});

module.exports = router;
