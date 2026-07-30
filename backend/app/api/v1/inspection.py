import json
import re
from fastapi import APIRouter, UploadFile, File, HTTPException
from google import genai
from PIL import Image
import io

import os

router = APIRouter()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY is not set in the environment variables.")

# Using client with env api key
client = genai.Client(api_key=API_KEY)

PROMPT = """
You are an expert heavy equipment inspector.

The FIRST image is BEFORE rental.
The SECOND image is AFTER rental.

Compare both images carefully.

Ignore:
- Lighting differences
- Camera angle changes
- Shadows
- Dust
- Mud

Only identify NEW visible damage.

Look for:
- Scratches
- Dents
- Cracks
- Broken lights
- Broken glass
- Bent bucket
- Hydraulic hose damage
- Missing mirrors
- Missing attachments
- Structural damage

Return ONLY valid JSON.

Example:

{
    "damages":[
        {
            "part":"Bucket",
            "damage":"Scratch",
            "severity":"Low",
            "confidence":0.94
        }
    ]
}
"""

@router.post("/analyze")
async def analyze_images(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...)
):
    try:
        # Read the images into memory
        before_bytes = await before_image.read()
        after_bytes = await after_image.read()

        # Open them with PIL
        before_pil = Image.open(io.BytesIO(before_bytes))
        after_pil = Image.open(io.BytesIO(after_bytes))

        # Call Gemini (using the exact model specified by the user)
        response = client.models.generate_content(
            model="models/gemini-3.6-flash",
            contents=[
                PROMPT,
                before_pil,
                after_pil
            ]
        )

        # Extract text and parse JSON
        text = response.text.strip()
        text = re.sub(r"```json", "", text, flags=re.IGNORECASE)
        text = re.sub(r"```", "", text).strip()

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # Fallback if Gemini didn't return pure JSON
            return {"damages": [], "raw_output": text, "error": "Failed to parse JSON from Gemini."}

        # Return the parsed data
        if not data.get("damages"):
            return {"damages": [], "message": "No visible damage detected."}
        
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
