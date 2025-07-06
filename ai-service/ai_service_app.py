# ai_service_app.py
from flask import Flask, request, jsonify
import json
import threading
import time
import os # For environment variables (recommended for security)

# Placeholder for your AI model (replace with actual model loading)
# For simplicity, let's simulate the model's behavior
# In a real scenario, you'd load your scikit-learn models here:
# import joblib
# hsse_model = joblib.load('hsse_relevance_model.pkl')
# category_model = joblib.load('report_category_model.pkl')
# vectorizer = joblib.load('vectorizer.pkl')

app = Flask(__name__)

# --- Mock AI Model Functions ---
# In a real application, these would use your loaded scikit-learn models
def predict_hsse_relevance(text):
    """Simulates predicting if text is HSSE related."""
    # This is a very basic keyword-based simulation.
    # Your actual model will be much more sophisticated.
    hsse_keywords = ["safety", "health", "environment", "security", "hazard", "incident", "violation", "risk", "pollution", "accident", "emergency", "spill"]
    
    # Check if any HSSE keyword is in the text (case-insensitive)
    if any(keyword in text.lower() for keyword in hsse_keywords):
        return True
    return False

def predict_report_category(text):
    """Simulates predicting the report category for HSSE related text."""
    # This is a basic keyword-based simulation.
    # Your actual model would use trained categories.
    text_lower = text.lower()
    
    if "spill" in text_lower or "leak" in text_lower or "pollution" in text_lower or "environmental" in text_lower:
        return "Environmental Compliance Violation"
    if "injury" in text_lower or "accident" in text_lower or "workplace" in text_lower or "safety" in text_lower:
        return "Workplace Safety Incident"
    if "security" in text_lower or "theft" in text_lower or "breach" in text_lower:
        return "Security Incident"
    if "fire" in text_lower or "explosion" in text_lower or "emergency" in text_lower:
        return "Emergency Response Event"
    
    return "Other HSSE Issue"

# --- Import and run the web scan worker in a separate thread ---
# This import needs to happen AFTER app is defined, and possibly within a function
# if you want to delay its execution, but for simplicity, we keep it here.
# NOTE: The worker will run its 'if __name__ == "__main__":' block only if executed directly.
# When imported, that block is skipped. We will manually call its function.
import web_scan_worker

# This function will be called in a new thread
def run_web_scan_in_background(urls):
    print(f"[App] Starting background scan for {len(urls)} URLs...")
    web_scan_worker.perform_web_scan(urls)
    print("[App] Background scan finished.")

@app.route('/')
def home():
    return "HSSE AI Service is running!"

@app.route('/predict_hsse_relevance', methods=['POST'])
def hsse_relevance():
    data = request.get_json()
    text = data.get('text', '')
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    is_hsse = predict_hsse_relevance(text)
    return jsonify({"is_hsse_related": is_hsse})

@app.route('/predict_report_category', methods=['POST'])
def report_category():
    data = request.get_json()
    text = data.get('text', '')
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    # In a real scenario, you'd likely call predict_hsse_relevance first,
    # or the calling service (web_scan_worker) would have already filtered.
    category = predict_report_category(text)
    return jsonify({"predicted_category": category})

@app.route('/start_web_scan', methods=['POST'])
def start_web_scan_endpoint():
    data = request.get_json()
    urls = data.get('urls', [])
    
    if not urls:
        return jsonify({"error": "No URLs provided"}), 400
    
    print(f"[App] Received request to scan {len(urls)} URLs.")
    
    # Start the web scan in a separate thread so the API call returns immediately
    scan_thread = threading.Thread(target=run_web_scan_in_background, args=(urls,))
    scan_thread.daemon = True # Allow the main program to exit even if thread is running
    scan_thread.start()
    
    return jsonify({"message": f"Web scan triggered for {len(urls)} URLs in background."}), 202

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)