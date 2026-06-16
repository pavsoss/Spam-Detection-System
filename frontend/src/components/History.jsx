import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";

function History({ darkMode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/history");
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteItem = async (id) => {
    try {
      await api.delete(`/api/history/${id}`);

      setHistory((prev) =>
        prev.filter((item) => item._id !== id)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete("/api/history");

      setHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <p>Loading history...</p>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          📜 History
        </h2>

        {history.length > 0 && (
          <button
            onClick={clearAll}
            className="bg-red-500 text-white px-3 py-1 rounded-lg"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p>No history found.</p>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item._id}
              className={`p-3 rounded-xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white/40 border-gray-300"
              }`}
            >
              <p className="font-medium">
                {item.query}
              </p>

              <p>
                Result:{" "}
                <span className="font-semibold">
                  {item.prediction}
                </span>
              </p>

              <p>
                Type: {item.type}
              </p>

              <p className="text-sm opacity-70">
                {new Date(
                  item.createdAt
                ).toLocaleString()}
              </p>

              <button
                onClick={() =>
                  deleteItem(item._id)
                }
                className="mt-2 bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;