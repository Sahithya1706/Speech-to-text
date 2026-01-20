// 1️⃣ Load env
require("dotenv").config();

// 2️⃣ Imports
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { createClient } = require("@deepgram/sdk");

// 3️⃣ DB
const connectDB = require("./config/db");
const Transcription = require("./models/Transcription");

// 4️⃣ App
const app = express();
app.use(cors());
connectDB();

// 5️⃣ Deepgram
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// 6️⃣ Multer
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// 7️⃣ Health check
app.get("/", (req, res) => {
  res.send("Backend server is running");
});

// 8️⃣ Upload + Transcribe + Save
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio uploaded" });
    }

    const audioBuffer = fs.readFileSync(req.file.path);

    const dg = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      { model: "nova-2", smart_format: true }
    );

    const text =
      dg.result.results.channels[0].alternatives[0].transcript;

    const doc = new Transcription({
      audioFile: req.file.filename,
      text,
    });
    await doc.save();

    res.json({ message: "Transcription successful", text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Transcription failed" });
  }
});

// 9️⃣ Get history
app.get("/transcriptions", async (req, res) => {
  try {
    const data = await Transcription.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

// 🔟 CLEAR HISTORY (THIS WORKS)
app.delete("/transcriptions", async (req, res) => {
  console.log("CLEAR HISTORY API HIT"); // 🔥 debug log
  try {
    const result = await Transcription.deleteMany({});
    res.json({
      message: "All transcriptions deleted",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete history" });
  }
});

// 1️⃣1️⃣ Start server
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port 5000");
});
