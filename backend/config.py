import os

BASE_URL = "https://analytics.parivahan.gov.in/analytics/publicdashboard"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://analytics.parivahan.gov.in/analytics/publicdashboard/vahan?lang=en",
    "Origin": "https://analytics.parivahan.gov.in",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin"
}

ENDPOINTS = {
    "Yearly Trend": "/vahandashboard/vahanyearwiseregistrationtrend",
    "Month Wise (Duration)": "/vahandashboard/durationWiseRegistrationTable",
    "Top 5 (State/RTO)": "/vahandashboard/top5chart",
    "Fuel": "/vahandashboard/fueltypedonutchart",
    "Class": "/vahandashboard/classdistribution",
    "Status": "/vahandashboard/statusdistribution"
}

# Cache file path located in backend/
CACHE_FILE = os.path.join(os.path.dirname(__file__), "companies_cache.json")
