# MediCheck AI - Medicine Safety Verification System

A real-time medicine safety verification app that uses AI and computer vision to verify medicines against prescriptions and user allergies.

## Features

✅ **Real Barcode/QR Scanning** - Live camera-based barcode detection  
✅ **Medicine Photo OCR** - Extract medicine name/strength from images  
✅ **Allergy Detection** - Cross-check medicines against user allergies  
✅ **Prescription Verification** - Upload prescription and match medicines  
✅ **AI Analysis** - OpenRouter free models (Mistral 7B with fallbacks)  
✅ **Judge Demo Mode** - 4 quick demo cases (no login required)  
✅ **Real Mode** - Full functionality with user profiles and history  
✅ **Clean White Design** - Modern healthcare app aesthetic  
✅ **Responsive Mobile UI** - Bottom navigation with center plus button  

## How It Works

### For Judges (Demo Mode)
1. Open the app → Click **"Try Judge Demo"**
2. You're logged in as "Judge Demo" (no password needed)
3. Go to **Demo tab** → Click any of 4 demo cases
4. View instant AI analysis result with confidence score
5. Generate report (PDF/TXT) to show results
6. **Total time: <30 seconds**

### For Real Users (Real Mode)
1. Open app → Click **"Real Mode"**
2. Add your profile (name, age, allergies, conditions)
3. Click the center **"+"** button to verify medicine
4. **Scan barcode** OR **upload medicine photo** OR **type medicine name**
5. **(Optional)** Upload prescription
6. Click **"Analyze Medicine"**
7. App calls OpenRouter Mistral 7B AI to verify
8. View result: SAFE / WARNING / DANGER
9. Download report

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Barcode Scanning**: QuaggaJS (real camera)
- **OCR**: Tesseract.js (browser-side)
- **AI**: OpenRouter API + Mistral 7B (free tier)
- **Storage**: Browser localStorage (no backend needed)
- **Deployment**: Static files (GitHub Pages, PythonAnywhere, any static host)

## File Structure

```
medicheck-ai/
├── index.html              (Main app structure)
├── css/
│   └── style.css          (White modern theme + responsive)
├── js/
│   ├── app.js             (Navigation, screens, logic)
│   ├── scanner.js         (QuaggaJS barcode scanning)
│   ├── ocr.js             (Tesseract.js OCR)
│   ├── ai.js              (OpenRouter API + rule logic)
│   └── demo.js            (4 demo cases for judges)
└── README.md              (This file)
```

## Installation & Deployment

### Option 1: GitHub Pages (Recommended)
```bash
git clone https://github.com/your-username/medicheck-ai.git
cd medicheck-ai
# Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Enable GitHub Pages in Settings → Pages → main branch
# Visit: https://your-username.github.io/medicheck-ai
```

### Option 2: PythonAnywhere Static
1. Upload all files to PythonAnywhere static files folder
2. Access via static URL

### Option 3: Local Testing
```bash
# Python 3+
python -m http.server 8000
# Open http://localhost:8000
```

## Demo Cases (Judge Testing)

### Demo 1: Safe Medicine ✓
- **Medicine**: Paracetamol 500mg
- **Prescription**: ✓ Matches
- **Allergies**: ✓ No conflict
- **Result**: SAFE (95% confidence)

### Demo 2: Wrong Medicine ✗
- **Medicine**: Lisinopril (blood pressure)
- **Prescription**: Paracetamol (fever)
- **Result**: DANGER - Wrong medicine (92% confidence)

### Demo 3: Allergy Conflict ✗
- **Medicine**: Amoxicillin (penicillin-based)
- **User Allergy**: Penicillin
- **Result**: DANGER - Allergy match (98% confidence)

### Demo 4: Dosage Mismatch ⚠
- **Medicine**: Ibuprofen 400mg tablet
- **Prescription**: Ibuprofen 200mg dose
- **Result**: WARNING - Dosage mismatch (88% confidence)

## AI Models Used

**Primary**: `mistralai/mistral-7b-instruct:free` (OpenRouter)
**Fallback 1**: `openchat/openchat-7b:free`
**Fallback 2**: `huggingface/zephyr-7b-beta:free`

When rate limit is hit, app auto-switches to next model. All free tier.

## Medicine Verification Logic

The app checks:
1. **Medicine Name Matching** - OCR/barcode vs prescription
2. **Dosage Check** - Compare scanned strength vs prescribed dose
3. **Allergy Verification** - Cross-check against user allergies
4. **Drug Interactions** - Check known dangerous combinations
5. **Confidence Score** - Based on OCR clarity and match certainty

## API Key Notes

The demo includes a **public key** (rate-limited). For production:
1. Get your own free OpenRouter key: https://openrouter.ai
2. Update `ai.js` line 2 with your key
3. Or judges can add their own key via settings (feature for v2)

## Judges Do NOT Need:

❌ Real medicines  
❌ Real prescriptions  
❌ Gmail account  
❌ Login credentials  
❌ Profile setup  
❌ Internet for basic features (works offline with mocked AI)

Just click → Demo → View result → Done!

## Browser Compatibility

✓ Chrome 90+  
✓ Firefox 88+  
✓ Safari 14+  
✓ Mobile browsers (iOS Safari, Chrome Mobile)  

Camera access required for live barcode scanning.

## Future Features (v2)

- PDF prescription upload with real OCR
- Medicine database API integration
- User accounts with cloud sync
- Batch scanning
- Integration with pharmacy APIs
- Prescription digital signature verification

## Support

For issues or questions during judging:
1. Try the Judge Demo first (fastest path)
2. Check browser console for errors (F12)
3. Ensure camera permissions are allowed
4. Try clearing localStorage: Open DevTools → Application → Clear storage

## License

MIT License - Free to use and modify

## Contact

Built as a Smart India Hackathon submission  
Demo for healthcare innovation competition

---

**Ready to test?** Open `index.html` in any browser → Click "Try Judge Demo" → Choose any case → See results in <30 seconds!
