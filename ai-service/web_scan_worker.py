# web_scan_worker.py
import requests
from bs4 import BeautifulSoup
import time
import psycopg2
import re
import os # For environment variables (recommended for security)

# --- Supabase Database Connection Details ---
DB_HOST = "aws-0-us-east-2.pooler.supabase.com" # New Pooler Host
DB_PORT = "5432" # Your provided Port (Note: Poolers often use 6543, but using 5432 as you specified)
DB_NAME = "postgres" # Your provided Database Name
DB_USER = "postgres.uhdvyvmyxfycnsxbtwen" # New User format (includes project ID)
DB_PASSWORD = os.environ.get("DB_PASSWORD")

# --- URL of your Flask AI Service (Running on the same Droplet) ---
FLASK_AI_SERVICE_URL = "http://127.0.0.1:5000"

def save_to_database(url, scanned_text, is_hsse_related, predicted_category):
    """Saves the scan results to the Supabase database."""
    print(f"[Worker] Inside save_to_database for {url}.")
    conn = None
    try:
        print(f"[Worker] Connecting to DB: Host={DB_HOST}, Port={DB_PORT}, DB={DB_NAME}, User={DB_USER}")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode='require' # Supabase requires SSL, this enforces it
        )
        print(f"[Worker] Successfully connected to database for {url}.")
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO scanned_violations (url, scanned_text, is_hsse_related, predicted_category)
            VALUES (%s, %s, %s, %s)
            """,
            (url, scanned_text, is_hsse_related, predicted_category)
        )
        conn.commit()
        cur.close()
        conn.close()
        print(f"[Worker] Successfully saved scan result for {url} to database.")
    except Exception as e:
        print(f"[Worker] !!! Database SAVE FAILED for {url} !!! ERROR: {e}")
        if conn:
            conn.rollback()
            conn.close()
        print(f"[Worker] ERROR: Could not save scan result for {url} to database: {e}")

def get_page_text(url):
    """Fetches a web page and extracts its main text content."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
        response = requests.get(url, timeout=15, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        elements = soup.find_all(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        text_content = ' '.join([elem.get_text(separator=' ', strip=True) for elem in elements])

        text_content = re.sub(r'\s+', ' ', text_content).strip()

        return text_content[:10000]
    except requests.exceptions.RequestException as e:
        print(f"[Worker] ERROR: Could not fetch URL {url}: {e}")
        return None
    except Exception as e:
        print(f"[Worker] ERROR: Could not parse content from {url}: {e}")
        return None

def analyze_text_with_ai(text):
    """Sends text to your local Flask AI service for prediction."""
    try:
        hsse_response = requests.post(
            f"{FLASK_AI_SERVICE_URL}/predict_hsse_relevance",
            json={"text": text},
            timeout=45
        )
        hsse_response.raise_for_status()
        is_hsse_related = hsse_response.json().get('is_hsse_related', False)

        predicted_category = "N/A"
        if is_hsse_related:
            category_response = requests.post(
                f"{FLASK_AI_SERVICE_URL}/predict_report_category",
                json={"text": text},
                timeout=45
            )
            category_response.raise_for_status()
            predicted_category = category_response.json().get('predicted_category', "Unknown")

        return is_hsse_related, predicted_category
    except requests.exceptions.RequestException as e:
        print(f"[Worker] ERROR: Could not communicate with AI service for text starting with '{text[:50]}...': {e}")
        return False, "Communication Error"
    except Exception as e:
        print(f"[Worker] ERROR: AI analysis failed for text starting with '{text[:50]}...': {e}")
        return False, "Analysis Error"

def perform_web_scan(urls_to_scan):
    """Main function to perform the web scanning and analysis."""
    print(f"[Worker] Starting web scan for {len(urls_to_scan)} URLs...")
    for url in urls_to_scan:
        print(f"[Worker] Scanning: {url}")
        text_content = get_page_text(url)
        if text_content:
            if len(text_content.strip()) > 50:
                is_hsse, category = analyze_text_with_ai(text_content)
                print(f"[Worker]    -> HSSE Related: {is_hsse}, Category: {category}")
                print(f"[Worker] Attempting to save data for {url} to database...")
                save_to_database(url, text_content, is_hsse, category)
            else:
                print(f"[Worker]    -> Skipped AI analysis for {url}: Insufficient text extracted.")
                print(f"[Worker] Attempting to save data for {url} (no AI analysis) to database...")
                save_to_database(url, text_content, False, "No Text/Not Analyzed")
        else:
            print(f"[Worker]    -> Skipped {url} due to content retrieval issues.")
        time.sleep(2)

    print("[Worker] Web scan complete.")

if __name__ == "__main__":
    # This block is for direct testing of the worker.
    # In the deployed Flask app, perform_web_scan is called by ai_service_app.py
    sample_urls = [
        "https://www.who.int/news-room/fact-sheets/detail/occupational-hazards",
        "https://www.ilo.org/global/topics/safety-and-health-at-work/lang--en/index.htm",
        "https://example.com"
    ]
    perform_web_scan(sample_urls)