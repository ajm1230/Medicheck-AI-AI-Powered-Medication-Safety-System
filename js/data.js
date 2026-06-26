/* MediCheck AI local sample knowledge base for judge demo and offline fallback. */
window.MEDICHECK_DB = {
  medicines: [
    {
      id: "paracetamol-650",
      name: "Paracetamol 650 mg",
      generic: "Paracetamol",
      className: "Analgesic / Antipyretic",
      strength: "650 mg",
      aliases: ["paracetamol", "acetaminophen", "dolo", "calpol", "crocin", "para 650"],
      barcodes: ["MEDI-PARA-650", "8901006500012", "QR-PARACETAMOL-650"],
      commonUse: ["fever", "headache", "body pain", "pain", "cold fever"],
      avoidIf: ["severe liver disease", "heavy alcohol use"],
      allergyTags: ["paracetamol", "acetaminophen"],
      interactions: ["warfarin", "isoniazid", "alcohol"],
      usualAdultDose: "500–650 mg every 6–8 hours when prescribed. Do not exceed safe daily limit.",
      expiryMonthsFromNow: 18,
      trustedManufacturer: true
    },
    {
      id: "amoxicillin-500",
      name: "Amoxicillin 500 mg",
      generic: "Amoxicillin",
      className: "Penicillin antibiotic",
      strength: "500 mg",
      aliases: ["amoxicillin", "amoxycillin", "mox", "amox 500"],
      barcodes: ["MEDI-AMOX-500", "8901005000099", "QR-AMOXICILLIN-500"],
      commonUse: ["bacterial infection", "throat infection", "dental infection"],
      avoidIf: ["penicillin allergy", "amoxicillin allergy", "cephalosporin severe allergy"],
      allergyTags: ["penicillin", "amoxicillin", "beta lactam"],
      interactions: ["methotrexate", "warfarin", "allopurinol"],
      usualAdultDose: "Use only when prescribed. Dose depends on infection type and doctor instruction.",
      expiryMonthsFromNow: 11,
      trustedManufacturer: true
    },
    {
      id: "azithromycin-500",
      name: "Azithromycin 500 mg",
      generic: "Azithromycin",
      className: "Macrolide antibiotic",
      strength: "500 mg",
      aliases: ["azithromycin", "azee", "azithral", "azimax", "zithro", "azithro 500"],
      barcodes: ["MEDI-AZI-500", "8901005000777", "QR-AZITHROMYCIN-500"],
      commonUse: ["bacterial infection", "respiratory infection", "throat infection"],
      avoidIf: ["qt prolongation", "severe liver disease", "arrhythmia"],
      allergyTags: ["azithromycin", "macrolide"],
      interactions: ["amiodarone", "warfarin", "digoxin", "antacid"],
      usualAdultDose: "Use only when prescribed. Common schedules vary by condition.",
      expiryMonthsFromNow: 8,
      trustedManufacturer: true
    },
    {
      id: "ibuprofen-400",
      name: "Ibuprofen 400 mg",
      generic: "Ibuprofen",
      className: "NSAID pain reliever",
      strength: "400 mg",
      aliases: ["ibuprofen", "brufen", "ibu", "ibugesic"],
      barcodes: ["MEDI-IBU-400", "8901004000112", "QR-IBUPROFEN-400"],
      commonUse: ["pain", "inflammation", "fever", "body pain"],
      avoidIf: ["stomach ulcer", "kidney disease", "blood thinner use", "asthma nsaid allergy"],
      allergyTags: ["ibuprofen", "nsaid"],
      interactions: ["warfarin", "aspirin", "steroid", "ace inhibitor"],
      usualAdultDose: "Take only as directed. Avoid without medical advice if gastric/kidney risk exists.",
      expiryMonthsFromNow: 2,
      trustedManufacturer: true
    },
    {
      id: "cetirizine-10",
      name: "Cetirizine 10 mg",
      generic: "Cetirizine",
      className: "Antihistamine",
      strength: "10 mg",
      aliases: ["cetirizine", "cetzine", "zyrtec", "cet 10"],
      barcodes: ["MEDI-CET-10", "8901001000101", "QR-CETIRIZINE-10"],
      commonUse: ["allergy", "sneezing", "itching", "runny nose"],
      avoidIf: ["severe kidney disease"],
      allergyTags: ["cetirizine"],
      interactions: ["alcohol", "sleeping pills"],
      usualAdultDose: "Often taken once daily when prescribed; may cause drowsiness.",
      expiryMonthsFromNow: 14,
      trustedManufacturer: true
    }
  ],
  judgeCases: [
    {
      id: "case-safe",
      title: "SAFE: Correct medicine",
      badge: "Green case",
      medicineText: "Paracetamol Tablets IP 650 mg, batch PC650, expiry 12/2027",
      barcodeText: "MEDI-PARA-650",
      prescriptionText: "Rx: Paracetamol 650 mg after food for fever. No known allergy.",
      symptomText: "Fever and body pain",
      patient: {
        name: "Judge Demo",
        email: "demo@medicheck.ai",
        age: "23",
        allergies: "none",
        conditions: "none",
        currentMeds: "none"
      }
    },
    {
      id: "case-warning",
      title: "WARNING: Interaction risk",
      badge: "Yellow case",
      medicineText: "Azithromycin 500 mg tablet, batch AZ500, expiry 09/2026",
      barcodeText: "MEDI-AZI-500",
      prescriptionText: "Rx: Azithromycin 500 mg once daily. Patient uses Warfarin.",
      symptomText: "Throat infection",
      patient: {
        name: "Judge Demo",
        email: "demo@medicheck.ai",
        age: "45",
        allergies: "none",
        conditions: "blood clot history",
        currentMeds: "warfarin"
      }
    },
    {
      id: "case-danger",
      title: "DANGER: Allergy mismatch",
      badge: "Red case",
      medicineText: "Amoxicillin 500 mg capsule, batch AM500, expiry 07/2027",
      barcodeText: "MEDI-AMOX-500",
      prescriptionText: "Rx: Amoxicillin 500 mg for dental infection.",
      symptomText: "Dental infection",
      patient: {
        name: "Judge Demo",
        email: "demo@medicheck.ai",
        age: "19",
        allergies: "penicillin allergy",
        conditions: "none",
        currentMeds: "none"
      }
    },
    {
      id: "case-counterfeit",
      title: "DANGER: Barcode and pack mismatch",
      badge: "Fake/expired risk",
      medicineText: "Ibuprofen 400 mg tablet, expiry 01/2024, broken seal, blurry print",
      barcodeText: "UNKNOWN-CODE-4455",
      prescriptionText: "Rx: Paracetamol 650 mg for fever.",
      symptomText: "Fever and headache",
      patient: {
        name: "Judge Demo",
        email: "demo@medicheck.ai",
        age: "31",
        allergies: "none",
        conditions: "stomach ulcer history",
        currentMeds: "aspirin"
      }
    }
  ],
  disclaimers: [
    "MediCheck AI is a hackathon prototype and decision-support tool, not a replacement for a doctor, pharmacist, or official medicine verification system.",
    "For serious symptoms, allergic reaction, pregnancy, child dosing, or emergency cases, contact a qualified healthcare professional immediately."
  ]
};
