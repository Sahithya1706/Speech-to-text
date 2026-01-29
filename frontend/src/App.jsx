import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "./supabase";

// 🔗 BACKEND URL
const API_BASE = "https://speech-to-text-backend-5uax.onrender.com";

function App() {
  // 🔐 Auth
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🎙 App state
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔄 Get logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // 📜 Fetch history (SAFE VERSION)
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/transcriptions`);
      setHistory(res.data);
    } catch {
      console.warn("History API not reachable yet");
      // ❌ DO NOT show error on UI
    }
  };

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  // 🔐 Auth handlers
  const handleSignup = async () => {
    setError("");
    setSuccess("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setSuccess("Signup successful. Please login.");
  };

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else setUser(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // 🎧 File handling
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["audio/mpeg", "audio/wav", "audio/mp3"];
    if (!allowed.includes(file.type)) {
      setError("Only MP3 or WAV files allowed");
      return;
    }

    setError("");
    setAudioFile(file);
  };

  // 🚀 Upload & transcribe
  const handleUpload = async () => {
    if (!audioFile) {
      setError("Please upload an audio file");
      return;
    }

    setLoading(true);
    setTranscript("");
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTranscript(res.data.text);
      setSuccess("Transcription successful");
      fetchHistory();
    } catch {
      setError("Speech to text failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🗑 Clear history
  const clearHistory = async () => {
    if (!window.confirm("Delete all transcription history?")) return;
    await axios.delete(`${API_BASE}/transcriptions`);
    setHistory([]);
  };

  // 🔐 LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow w-full max-w-sm">
          <h2 className="text-xl font-bold text-center mb-4">
            Login / Signup
          </h2>

          <input
            className="w-full border p-2 mb-2 rounded"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border p-2 mb-4 rounded"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded mb-2"
          >
            Login
          </button>

          <button
            onClick={handleSignup}
            className="w-full bg-gray-600 text-white py-2 rounded"
          >
            Sign Up
          </button>

          {error && <p className="text-red-500 mt-2">{error}</p>}
          {success && <p className="text-green-500 mt-2">{success}</p>}
        </div>
      </div>
    );
  }

  // 🎙 MAIN APP
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded"
      >
        Logout
      </button>

      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-4">
          🎙️ Speech to Text
        </h1>

        <input
          type="file"
          accept="audio/*"
          disabled={loading}
          onChange={handleFileChange}
          className="w-full border p-2 rounded mb-3"
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className={`w-full py-2 rounded text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "🎧 Converting, please wait..." : "Convert to Text"}
        </button>

        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
        {success && <p className="text-green-500 mt-2 text-center">{success}</p>}

        <textarea
          rows="4"
          readOnly
          value={transcript}
          className="w-full border p-2 rounded mt-4"
        />

        <div className="mt-6 flex justify-between items-center">
          <h2 className="text-lg font-semibold">📜 History</h2>
          <button
            onClick={clearHistory}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Clear History
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2 italic">
            No transcriptions yet. Upload an audio file 👆
          </p>
        ) : (
          history.map((h) => (
            <div key={h._id} className="border rounded p-3 mt-2 bg-gray-50">
              <p className="text-xs text-gray-500">
                {new Date(h.createdAt).toLocaleString()}
              </p>
              <p className="mt-1">{h.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
