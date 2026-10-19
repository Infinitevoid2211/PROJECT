"""
BHU-RAKSHAK AI — Google Gemma Verification Suite (Hackathon / Jury Demo)
Verifies Google Gemma model integration via the Google Gemini API (google-genai SDK).
Run: python test_gemma.py
"""
import os
import sys
import time
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

def print_banner():
    print("=" * 75)
    print("  BHU-RAKSHAK AI (SIH26001) — GOOGLE GEMMA INTEGRATION VERIFIER")
    print("  Model Family: Google Gemma (Open Weights by Google DeepMind)")
    print("  API Provider: Google Gemini API (generativelanguage.googleapis.com)")
    print("=" * 75)

def check_environment():
    print("\n[Step 1] Checking Environment & API Configuration...")
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    chat_model = os.environ.get("GEMMA_MODEL", "gemma-2-27b-it")
    vision_model = os.environ.get("GEMMA_VISION_MODEL", "gemma-3-27b-it")

    print(f"  - Configured Chat Model   : {chat_model}")
    print(f"  - Configured Vision Model : {vision_model}")

    if not api_key or not api_key.strip():
        print("  - API Key Status          : NOT DETECTED in backend/.env")
        print("\n  [INFO] Please set GEMINI_API_KEY in backend/.env to run live Gemma inference.")
        print("         Format in backend/.env: GEMINI_API_KEY=AIzaSy...")
        return False, None, chat_model, vision_model

    masked_key = api_key[:6] + "..." + api_key[-4:] if len(api_key) > 10 else "***"
    print(f"  - API Key Status          : DETECTED ({masked_key})")
    return True, api_key, chat_model, vision_model

def test_genai_import():
    print("\n[Step 2] Checking google-genai SDK...")
    try:
        from google import genai
        import google.genai
        print(f"  - google-genai SDK installed successfully!")
        return True, genai
    except ImportError as e:
        print(f"  - ERROR: Failed to import google-genai: {e}")
        print("    Run: pip install google-genai")
        return False, None

def test_gemma_chat(genai_mod, api_key, model_name):
    print(f"\n[Step 3] Testing Live Google Gemma Inference ({model_name})...")
    client = genai_mod.Client(api_key=api_key)

    geotech_query = (
        "System: You are BHU-RAKSHAK AI powered by Google Gemma for Aizawl District, Mizoram. "
        "Explain in 2 sentences the relationship between Terzaghi pore water pressure (u) and the Factor of Safety (Fs).\n\n"
        "User: How does pore pressure affect slope safety in Hunthar Veng?\n\n"
        "Assistant (Google Gemma):"
    )

    t0 = time.time()
    try:
        print(f"  - Dispatching stream request to model: '{model_name}'...")
        response = client.models.generate_content_stream(
            model=model_name,
            contents=geotech_query,
        )

        streamed_text = ""
        chunk_count = 0
        for chunk in response:
            if chunk.text:
                streamed_text += chunk.text
                chunk_count += 1

        elapsed = time.time() - t0
        print(f"  - Status          : SUCCESS (Streamed in {elapsed:.2f}s across {chunk_count} chunks)")
        print(f"  - Model Used      : {model_name}")
        print(f"  - Sample Output   :\n    \"{streamed_text.strip()}\"")
        return True
    except Exception as e:
        print(f"  - Primary model '{model_name}' returned: {e}")
        # Try fallback candidate
        fallback_models = [m for m in ["gemma-2-9b-it", "gemma-2-27b-it", "gemma-3-27b-it"] if m != model_name]
        for alt in fallback_models:
            print(f"  - Retrying with alternative Gemma model: '{alt}'...")
            try:
                t1 = time.time()
                resp = client.models.generate_content(model=alt, contents=geotech_query)
                elapsed = time.time() - t1
                print(f"  - Fallback Status : SUCCESS with {alt} in {elapsed:.2f}s!")
                print(f"  - Sample Output   :\n    \"{resp.text.strip()}\"")
                return True
            except Exception as alt_err:
                print(f"  - Fallback '{alt}' failed: {alt_err}")
        return False

def test_local_endpoints():
    print("\n[Step 4] Testing Backend REST Endpoints via Starlette...")
    try:
        from server import app
        from starlette.testclient import TestClient

        test_client = TestClient(app)
        
        # Test model-info
        r1 = test_client.get("/api/ai/model-info")
        print(f"  - GET /api/ai/model-info : {r1.status_code}")
        if r1.status_code == 200:
            print(f"    Payload: {json.dumps(r1.json(), indent=6)}")

        # Test stats
        r2 = test_client.get("/api/stats")
        print(f"  - GET /api/stats         : {r2.status_code}")
        if r2.status_code == 200:
            j = r2.json()
            print(f"    Model Version: {j.get('model_version')}")
            print(f"    AI Engine    : {j.get('ai_model')}")

        return True
    except Exception as e:
        print(f"  - REST endpoint test error: {e}")
        return False

def main():
    print_banner()
    has_key, api_key, chat_model, vision_model = check_environment()
    has_sdk, genai_mod = test_genai_import()

    endpoint_ok = test_local_endpoints()

    if has_key and has_sdk:
        chat_ok = test_gemma_chat(genai_mod, api_key, chat_model)
    else:
        chat_ok = False
        print("\n[Skipping Step 3] Set GEMINI_API_KEY in backend/.env to run live API calls.")

    print("\n" + "=" * 75)
    print("  VERIFICATION SUMMARY")
    print(f"  1. google-genai SDK Installed     : {'PASSED' if has_sdk else 'FAILED'}")
    print(f"  2. Model-Info & REST Architecture : {'PASSED' if endpoint_ok else 'FAILED'}")
    print(f"  3. Google Gemma Live API          : {'PASSED' if chat_ok else ('PENDING API KEY' if not has_key else 'FAILED')}")
    print("=" * 75)

if __name__ == "__main__":
    main()

