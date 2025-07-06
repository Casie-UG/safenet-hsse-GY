# discover_urls.py
import requests
import json
import os
import time
import psycopg2 # To check for existing URLs

# --- News API Configuration ---
NEWS_API_KEY = os.environ.get("NEWS_API_KEY")
NEWS_API_ENDPOINT = "https://newsapi.org/v2/everything"
SEARCH_KEYWORDS = "HSSE OR \"Health Safety Security Environment\" OR \"safety violation\" OR \"environmental incident\" OR \"oil spill\" OR \"gas leak\" OR \"industrial accident\" OR \"workplace injury\" OR \"Guyana\"" # ADDED "OR \"Guyana\""
# Note: NewsAPI's 'q' parameter can use OR for multiple keywords.
# Adjust these keywords to be most relevant to HSSE violations you seek.

# --- Your Flask AI Service Endpoint ---
FLASK_SCAN_ENDPOINT = "http://127.0.0.1:5000/start_web_scan"

# --- Supabase Database Connection Details (for deduplication) ---
DB_HOST = "aws-0-us-east-2.pooler.supabase.com"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres.uhdvyvmyxfycnsxbtwen" # Ensure this matches your Supabase user with project ID
DB_PASSWORD = "c0mplic@t3d" # <<<<<<< YOUR ACTUAL SUPABASE DATABASE PASSWORD IS HERE

def get_existing_urls_from_db():
    """Fetches all URLs currently in the scanned_violations table for deduplication."""
    conn = None
    existing_urls = set()
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode='require'
        )
        cur = conn.cursor()
        cur.execute("SELECT url FROM scanned_violations")
        for row in cur.fetchall():
            existing_urls.add(row[0])
        cur.close()
        conn.close()
        print(f"[Discovery] Found {len(existing_urls)} existing URLs in DB.")
    except Exception as e:
        print(f"[Discovery] ERROR fetching existing URLs from DB: {e}")
        # If we can't connect, proceed without deduplication to avoid blocking
    return existing_urls

def discover_and_scan_urls():
    print(f"[Discovery] Starting URL discovery with keywords: {SEARCH_KEYWORDS}")
    
    # Get URLs already in your database to avoid re-scanning
    existing_urls = get_existing_urls_from_db()

    params = {
        "q": SEARCH_KEYWORDS,
        "language": "en",
        "sortBy": "relevancy", # or 'publishedAt'
        "pageSize": 50, # Number of articles per request (max for free tier)
        "apiKey": NEWS_API_KEY
    }

    try:
        response = requests.get(NEWS_API_ENDPOINT, params=params, timeout=10)
        response.raise_for_status() # Raise an exception for HTTP errors
        data = response.json()

        if data["status"] == "ok":
            articles_found = 0
            articles_to_scan = []
            for article in data["articles"]:
                url = article.get("url")
                if url and url not in existing_urls:
                    articles_to_scan.append(url)
                    articles_found += 1
                    existing_urls.add(url) # Add to set to prevent duplicates within this run too
                else:
                    if url:
                        print(f"[Discovery] Skipping already scanned URL: {url}")
            
            if articles_to_scan:
                print(f"[Discovery] Discovered {len(articles_to_scan)} new articles. Sending to Flask scanner...")
                
                try:
                    flask_response = requests.post(
                        FLASK_SCAN_ENDPOINT,
                        json={"urls": articles_to_scan},
                        timeout=60 # Give Flask some time to process
                    )
                    flask_response.raise_for_status()
                    print(f"[Discovery] Successfully sent {len(articles_to_scan)} URLs to Flask scanner. Response: {flask_response.json()}")
                except requests.exceptions.RequestException as e:
                    print(f"[Discovery] ERROR sending URLs to Flask scanner: {e}")
            else:
                print("[Discovery] No new articles found matching criteria or all are already scanned.")
        else:
            print(f"[Discovery] NewsAPI error: {data.get('message', 'Unknown error')}")

    except requests.exceptions.RequestException as e:
        print(f"[Discovery] ERROR connecting to NewsAPI: {e}")
    except json.JSONDecodeError as e:
        print(f"[Discovery] ERROR decoding NewsAPI response (invalid JSON): {e}")
    except Exception as e:
        print(f"[Discovery] An unexpected error occurred during discovery: {e}")

    print("[Discovery] URL discovery complete.")

if __name__ == "__main__":
    discover_and_scan_urls()