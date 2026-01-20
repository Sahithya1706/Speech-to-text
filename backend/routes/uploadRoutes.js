app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const audioBuffer = fs.readFileSync(req.file.path);

    const dgResponse = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: "nova-2",
        smart_format: true,
      }
    );

    const transcript =
      dgResponse.result.results.channels[0].alternatives[0].transcript;

    // 🔹 SAVE TO DATABASE (DAY 7 MAIN PART)
    const newTranscription = new Transcription({
      audioFile: req.file.filename,
      text: transcript,
    });

    await newTranscription.save();

    res.json({
      message: "Transcription successful",
      text: transcript,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Transcription failed" });
  }
});
