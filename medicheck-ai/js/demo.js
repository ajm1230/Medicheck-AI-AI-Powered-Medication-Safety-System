const demo = {
    cases: {
        1: {
            name: 'Safe Medicine Demo',
            medicineData: {
                barcode: 'MEDICHECK|name=Paracetamol|strength=500mg|form=tablet|batch=B123|expiry=2027-05|manufacturer=DemoPharma',
                photo: null,
                ocrText: 'PARACETAMOL 500MG TABLET',
                manualText: 'Paracetamol 500mg',
                prescription: 'Rx: Paracetamol 500mg, 1 tablet twice daily for fever'
            },
            result: {
                status: 'safe',
                medicineName: 'Paracetamol 500mg',
                confidence: 95,
                message: '✓ SAFE: Verified',
                reason: 'Medicine verified. No allergies or interactions detected.',
                warnings: [],
                recommendations: ['Take with food if stomach upset occurs', 'Do not exceed 4000mg daily']
            }
        },
        2: {
            name: 'Wrong Medicine Demo',
            medicineData: {
                barcode: 'MEDICHECK|name=Lisinopril|strength=10mg',
                photo: null,
                ocrText: 'LISINOPRIL 10MG TABLET',
                manualText: '',
                prescription: 'Rx: Paracetamol 500mg for fever'
            },
            result: {
                status: 'danger',
                medicineName: 'Lisinopril 10mg',
                confidence: 92,
                message: '✗ DANGER: Wrong Medicine',
                reason: 'Scanned medicine (Lisinopril) does NOT match prescription (Paracetamol)',
                warnings: ['Medicine mismatch', 'Different drug class', 'Could cause harm if taken'],
                recommendations: ['STOP - Do not take', 'Verify with pharmacy', 'Get correct medicine']
            }
        },
        3: {
            name: 'Allergy Risk Demo',
            medicineData: {
                barcode: 'MEDICHECK|name=Amoxicillin|strength=500mg',
                photo: null,
                ocrText: 'AMOXICILLIN 500MG CAPSULE (Penicillin-based)',
                manualText: 'Amoxicillin 500mg',
                prescription: 'Rx: Amoxicillin 500mg for infection'
            },
            result: {
                status: 'danger',
                medicineName: 'Amoxicillin 500mg',
                confidence: 98,
                message: '✗ DANGER: Allergy Conflict',
                reason: 'Amoxicillin is penicillin-based. User profile shows PENICILLIN ALLERGY.',
                warnings: ['Known allergy match', 'Risk of anaphylaxis', 'Do not consume'],
                recommendations: ['Contact prescriber IMMEDIATELY', 'Request alternative antibiotic (cephalosporin or macrolide)', 'Get allergy-safe medicine']
            }
        },
        4: {
            name: 'Dosage Mismatch Demo',
            medicineData: {
                barcode: 'MEDICHECK|name=Ibuprofen|strength=400mg',
                photo: null,
                ocrText: 'IBUPROFEN 400MG TABLET',
                manualText: '',
                prescription: 'Rx: Ibuprofen 200mg, 1 tablet three times daily for pain'
            },
            result: {
                status: 'warning',
                medicineName: 'Ibuprofen 400mg',
                confidence: 88,
                message: '⚠ WARNING: Dosage Mismatch',
                reason: 'Prescription says 200mg tablet, but scanned medicine is 400mg strength.',
                warnings: ['Dosage mismatch', 'Could lead to overdose', 'Need clarification'],
                recommendations: ['Confirm with pharmacist', 'If 400mg tablet: take 1/2 tablet per dose', 'Or request 200mg tablets']
            }
        }
    },

    getDemoCase(demoId) {
        const demoCase = this.cases[demoId];
        return {
            medicineData: demoCase.medicineData,
            result: demoCase.result
        };
    }
};
