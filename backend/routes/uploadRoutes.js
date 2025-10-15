const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const CreditReport = require("../models/CreditReport");
const { parseXML } = require("../utils/xmlParser");

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "credit-report-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/xml" || file.originalname.endsWith(".xml")) {
    cb(null, true);
  } else {
    cb(new Error("Only XML files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST /api/upload - Upload and process XML file
router.post("/", upload.single("xmlFile"), async (req, res) => {
    try {
      console.log("📥 Received upload request");
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or invalid file type",
      });
    }

    console.log("📤 Processing file:", req.file.originalname);

    // Parse XML file
    const parsedData = await parseXML(req.file.path);

    // Save to MongoDB
    const creditReport = new CreditReport({
      ...parsedData,
      fileName: req.file.originalname,
    });

    await creditReport.save();

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    console.log("✅ Credit report saved:", creditReport._id);

    res.status(201).json({
      success: true,
      message: "File uploaded and processed successfully",
      reportId: creditReport._id,
      data: creditReport,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);

    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error("Failed to delete file:", e);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to process XML file",
    });
  }
});

module.exports = router;
