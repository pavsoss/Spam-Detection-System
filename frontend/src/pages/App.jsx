import { useState } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import api from "../utils/axiosInstance";
import "../App.css";
import { useNavigate } from "react-router-dom";
import FeatureImportance from "../components/FeatureImportance";
import History from "../components/History";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("message");
  const [darkMode, setDarkMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handlePredict = async () => {
    if (!text) return;

    try {
      setLoading(true);
      const res = await api.post(`${import.meta.env.VITE_API_URI}/predict`, {
        text: text,
        type: type,
      });
      setResult(res.data.prediction);
      setConfidence(res.data.confidence ?? null);
    } catch (error) {
      setResult("Error");
    } finally {
      setLoading(false);
    }
  };

  const getColor = () => {
    if (result === "ham") return "text-green-600";
    if (result === "spam") return "text-red-600";
    if (result === "smishing") return "text-orange-500";
    return "text-gray-600";
  };

  const getBg = () => {
    if (result === "ham")
      return "bg-[#81912F]/25 backdrop-blur-md border border-white/30";
    if (result === "spam")
      return "bg-red-400/20 backdrop-blur-md border border-white/30";
    if (result === "smishing")
      return "bg-orange-400/20 backdrop-blur-md border border-white/30";
    return "bg-white/20 backdrop-blur-md border border-white/30";
  };

  const confidencePct =
    confidence !== null
      ? Math.min(confidence * 50 + 50, 100).toFixed(1)
      : "0.0";

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black"
          : "bg-gradient-to-br from-blue-500 via-pink-300 to-cyan-600"
      }`}
    >
      {/* Top Navbar */}
      <div className="flex justify-between items-center p-4">
        <span
          className={`text-sm font-medium px-4 py-2 rounded-full ${
            darkMode ? "bg-gray-700 text-gray-300" : "bg-white/30 text-gray-800"
          }`}
        >
          👤 {user?.username}
        </span>

        <div className="flex gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
          >
            📜 History
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
              darkMode
                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-500"
          >
            Logout
          </button>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div
          className={`fixed top-0 left-0 h-full w-80 overflow-y-auto p-4 shadow-2xl z-50 ${
            darkMode ? "bg-gray-900 text-white" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">📜 History</h2>

            <button
              onClick={() => setShowHistory(false)}
              className="text-red-500 text-xl"
            >
              ✕
            </button>
          </div>

          <History darkMode={darkMode} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex justify-center items-center px-4 py-8">
        <div
          className={`w-full max-w-lg backdrop-blur-xl border rounded-3xl shadow-2xl p-6 sm:p-8 text-center transition-all duration-500 ${
            darkMode
              ? "bg-gray-900/40 border-gray-600"
              : "bg-white/20 border-white/20"
          }`}
        >
          <div
            className={`rounded-2xl p-6 sm:p-8 transition-all duration-500 ${
              darkMode
                ? "bg-gray-800/70 text-white"
                : "bg-[#FAF1E6]/35 text-black"
            }`}
          >
            <h1 className="text-3xl font-bold mb-2">📩 Spam Detector</h1>

            <p
              className={`font-semibold text-sm mb-4 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Analyze messages & emails instantly
            </p>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`w-full p-3 rounded-xl border mb-4 ${
                darkMode ? "bg-gray-700 text-white" : "bg-white text-black"
              }`}
            >
              <option value="message">Message</option>
              <option value="email">Email</option>
            </select>

            <textarea
              rows="4"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                type === "message"
                  ? "Type your message..."
                  : "Paste your email content..."
              }
              className={`w-full border p-3 rounded-xl resize-none ${
                darkMode ? "bg-gray-700 text-white" : "bg-white text-black"
              }`}
            />

            <button
              onClick={handlePredict}
              className="mt-4 w-full py-3 rounded-xl font-medium bg-indigo-500 text-white hover:bg-indigo-600"
            >
              {loading ? "Analyzing..." : `Analyze ${type}`}
            </button>

            {result && (
              <div className="mt-4">
                <div
                  className={`p-4 rounded-xl font-semibold ${getBg()} ${getColor()}`}
                >
                  {result === "ham" && "✅ Safe Message"}
                  {result === "spam" && "❌ Spam Detected"}
                  {result === "smishing" && "⚠️ Fraud Alert"}
                  {result === "Error" && "⚠️ Something went wrong"}
                </div>
              </div>
            )}

            {result && confidence !== null && result !== "Error" && (
              <div className="mt-4 text-left">
                <p className="text-sm mb-1">
                  Model Confidence: {confidencePct}%
                </p>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      result === "ham"
                        ? "bg-green-500"
                        : result === "spam"
                          ? "bg-red-500"
                          : "bg-orange-500"
                    }`}
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setText("");
                setResult("");
                setConfidence(null);
                setType("message");
              }}
              className="mt-4 w-full py-3 rounded-xl bg-gray-500 text-white hover:bg-gray-600"
            >
              Reset
            </button>

            <FeatureImportance darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
