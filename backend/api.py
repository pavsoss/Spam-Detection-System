from flask import Flask, request, jsonify
import joblib
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)


MODEL_PATH = os.getenv("MODEL_PATH")
VECTORIZER_PATH = os.getenv("VECTORIZER_PATH")
LABEL_ENCODER_PATH = os.getenv("LABEL_ENCODER_PATH")

if not MODEL_PATH or not VECTORIZER_PATH or not LABEL_ENCODER_PATH:
    raise ValueError("Required environment variables are missing")

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)

@app.route("/")
def home():
    return "ML API Running 🚀"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        text = data.get("text")
        if not text:
            return jsonify({"error": "No text provided"}), 400

    
        text_vector = vectorizer.transform([text])

   
        prediction = model.predict(text_vector)

  
        final_output = label_encoder.inverse_transform(prediction)[0]

        return jsonify({
            "input": text,
            "prediction": final_output
        })

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=True)