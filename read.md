# MediCheck AI — AI-Powered Medication Safety Web App

MediCheck AI is a hackathon-ready web app prototype that checks whether multiple medicines are safe for a user’s health problem, prescription, allergy profile, lifestyle risks and current medicines.

It is designed to feel like a premium mobile app inside the browser. On laptop it opens as a centered phone UI, and on mobile it becomes full screen. Mouse and touch both work.

> Important: This is a prototype and not a replacement for a doctor, pharmacist or emergency care.

---

## What the app does

1. Takes the user’s health problem by text or speech-to-text.
2. Builds a short visual safety profile: allergies, alcohol, smoking, liver/kidney/asthma/diabetes/acidity risks and current medicines.
3. Accepts multiple medicine photos.
4. Runs OCR using Tesseract.js when available.
5. Attempts barcode/QR reading using the browser BarcodeDetector where supported.
6. Accepts prescription image/PDF or a demo handwritten prescription.
7. Sends structured input to AI and expects strict JSON.
8. Generates a visual safety report with:
   - Safe medicines
   - Moderate / caution medicines
   - Unsafe / avoid medicines
   - Allergy risk
   - Duplicate salt warning
   - Interaction warning
   - Expiry/label check
   - Precautions, diet, water and foods to avoid
   - Doctor availability section
9. Speaks a short report summary using browser text-to-speech.
10. Stores records locally in browser localStorage.

---

## Best judge demo flow

1. Open `index.html`.
2. Click **Start Safety Check**.
3. Click **Auto Fill Demo Problem**.
4. Click **Auto Fill Demo Profile**.
5. Click **Auto Add Demo Medicines**.
6. Click **Use Example Handwritten Prescription**.
7. Click **Submit for AI Safety Check**.
8. Show report:
   - Paracetamol = safe
   - Ibuprofen = unsafe because allergy profile contains ibuprofen
   - Amoxicillin = moderate/caution because antibiotic needs doctor confirmation
9. Use **Speak Summary**, **Doctor Help**, **Download JSON Report**, and **Records**.

---

## Tech stack

- HTML5
- CSS3 glassmorphism UI
- Vanilla JavaScript
- OpenRouter AI API integration
- Strict JSON report pipeline
- Browser Speech Recognition API
- Browser Speech Synthesis API
- Tesseract.js OCR loaded only when needed
- Browser BarcodeDetector API where supported
- localStorage for records
- No build tools required

---

## Hardcoded API key

The API key is hardcoded in:

```js
js/ai.js
```

Find this line:

```js
const OPENROUTER_API_KEY = "PASTE_OPENROUTER_API_KEY_HERE";
```

Replace it with your OpenRouter key.

Example:

```js
const OPENROUTER_API_KEY = "sk-or-v1-your-key-here";
```

For hackathon prototype this is simple. For production, do not expose API keys in frontend code. Use a backend server.

---

## AI input JSON

The app sends data like this to the AI:

```json
{
  "health_problem": "Fever, body pain and mild acidity",
  "profile": {
    "age": 16,
    "allergies": ["Ibuprofen"],
    "alcohol": "sometimes",
    "smoking": "no",
    "conditions": ["Acidity"],
    "current_medicines": []
  },
  "medicines": [
    {
      "id": "med_1",
      "ocr_text": "Paracetamol 650 mg Exp 08/2027",
      "barcode_data": "DEMO-DL650-PARACETAMOL",
      "image_name": "med_1"
    }
  ],
  "prescription_ocr_text": "Paracetamol 650 mg after food twice daily for 3 days"
}
```

---

## AI output JSON schema

The AI is instructed to return only JSON:

```json
{
  "overall_status": "SAFE | MODERATE | UNSAFE",
  "overall_score": 72,
  "summary": "Short user-friendly summary.",
  "medicine_results": [
    {
      "medicine_name": "Paracetamol 650 mg",
      "status": "SAFE",
      "score": 88,
      "category": "safe",
      "reason": "Matches fever and prescription.",
      "prescription_match": true,
      "allergy_risk": false,
      "dose_note": "Take after food as prescribed.",
      "action": "Can be taken as per prescription."
    }
  ],
  "allergy_check": {
    "risk_found": true,
    "details": "Ibuprofen allergy conflict found."
  },
  "duplicate_salt_check": {
    "risk_found": false,
    "details": "No duplicate salt detected."
  },
  "interaction_check": {
    "risk_found": true,
    "details": "Confirm medicine combination with doctor."
  },
  "expiry_check": {
    "status": "not_clear",
    "details": "Expiry not clearly detected from image."
  },
  "care_guidance": {
    "precautions": [],
    "diet": [],
    "water": [],
    "avoid": [],
    "when_to_contact_doctor": []
  },
  "doctor_summary": "Short doctor-facing summary.",
  "voice_summary": "Short spoken summary."
}
```

---

## Fallback behavior

If the OpenRouter API key is missing, internet is unavailable, CORS fails, or the AI returns invalid JSON, the app does not break. It shows:

**Live AI unavailable/key missing: fallback analysis generated locally.**

The fallback engine still uses the same user inputs, allergy profile, prescription text and medicine OCR text to generate a safe/moderate/unsafe report. This keeps the hackathon demo stable on all devices.

---

## File structure

```text
medicheck-ai-full/
├── index.html
├── README.md
├── read.md
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── ai.js
│   ├── barcode.js
│   ├── demo-data.js
│   ├── ocr.js
│   ├── storage.js
│   └── voice.js
└── assets/
    ├── logo.svg
    ├── sample-medicine-1.svg
    ├── sample-medicine-2.svg
    ├── sample-medicine-3.svg
    └── sample-prescription.svg
```

---

## How to run

### Option 1: Direct open
Open `index.html` in browser.

### Option 2: Local server
Recommended for best browser API behavior:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

---

## Device support

- Android Chrome: upload, camera capture, voice, speech, OCR, local records
- Laptop Chrome/Edge: mouse clicks, upload, speech where supported, OCR, records
- iPhone Safari: upload/camera capture and speech synthesis; speech recognition depends on browser support

---

## Lightweight performance choices

- No heavy framework
- No build process
- SVG demo images instead of large PNG files
- OCR library loads only when user uploads an image
- Demo sample text bypasses heavy OCR for fast judge testing
- Short animations only
- All data stored locally

---

## Next-round roadmap

- Backend server to protect API keys
- Real medicine database integration
- Full barcode/QR database lookup
- Prescription PDF OCR with server-side OCR
- Doctor/clinic API integration
- Pharmacy verification network
- PDF report export
- Multilingual voice guidance
- User account and secure cloud history
- Emergency escalation and verified doctor handoff
