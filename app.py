import os
from functools import wraps
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

API_KEY = os.environ.get("API_KEY", "")


def require_api_key(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not API_KEY or request.headers.get("X-API-Key") != API_KEY:
            return jsonify({"error": "Unauthorized"}), 401
        return view_func(*args, **kwargs)
    return wrapped

BASE_FARE = 15
RATE_PER_KM = 12

LANGUAGE_NAMES = {
    "kn": "Kannada",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "en": "English",
}


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/estimate-fare", methods=["POST"])
@require_api_key
def estimate_fare():
    data = request.get_json(force=True)
    distance_km = data.get("distance_km")
    duration_min = data.get("duration_min")

    if distance_km is None:
        return jsonify({"error": "distance_km is required"}), 400

    fare = round(BASE_FARE + distance_km * RATE_PER_KM)

    return jsonify({
        "fare": fare,
        "eta_min": round(duration_min) if duration_min is not None else round(distance_km * 1.5),
        "distance_km": round(distance_km, 2),
        "payment_method": "Cash"
    })


@app.route("/api/translate", methods=["POST"])
@require_api_key
def translate_message():
    data = request.get_json(force=True)
    text = data.get("text", "").strip()
    target_lang = data.get("target_lang", "kn")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    if not gemini_client:
        return jsonify({
            "translated": text,
            "warning": "GEMINI_API_KEY is not set in .env — showing original text unchanged."
        })

    target_name = LANGUAGE_NAMES.get(target_lang, target_lang)
    prompt = (
        f"Detect the language of the following message and translate it into {target_name}. "
        f"Reply with ONLY the translated text — no explanation, no quotes, no extra words.\n\n"
        f"Message: {text}"
    )

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        translated = response.text.strip()
    except Exception as e:
        print(f"[Gemini error] {e}")
        translated = text

    return jsonify({"translated": translated})


@app.route("/api/sos", methods=["POST"])
@require_api_key
def sos():
    return jsonify({
        "status": "not_configured",
        "message": "SOS is under development. It needs an emergency contact number set up first."
    })


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")
