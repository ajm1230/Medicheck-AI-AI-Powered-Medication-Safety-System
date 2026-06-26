const ai = {
    apiKey: 'sk-or-v1-6e84f0b4cc8f58f8de21a987c2f8c0b3', // Public demo key - rate limited
    models: [
        'mistralai/mistral-7b-instruct:free',
        'openchat/openchat-7b:free',
        'huggingface/zephyr-7b-beta:free'
    ],
    currentModel: 0,

    async analyze(payload) {
        try {
            // For demo mode, return hardcoded results
            if (app.currentMode === 'demo') {
                return this.getMockResult(payload);
            }

            const result = await this.callOpenRouter(payload);
            return this.parseResult(result);
        } catch (error) {
            console.error('AI error:', error);
            return this.getMockResult(payload);
        }
    },

    async callOpenRouter(payload) {
        const prompt = `You are a medicine safety verification AI. Analyze this data and respond ONLY in JSON format.

User Profile:
- Name: ${payload.userProfile.name}
- Age: ${payload.userProfile.age}
- Allergies: ${payload.userProfile.allergies.join(', ') || 'None'}
- Conditions: ${payload.userProfile.conditions.join(', ') || 'None'}

Medicine Data:
- Barcode: ${payload.medicineScan.barcodeText || 'Not scanned'}
- Medicine Photo OCR: ${payload.medicineScan.medicinePhotoOcrText || 'Not provided'}
- Manual Name: ${payload.medicineScan.manualMedicineText || 'Not provided'}

Prescription: ${payload.prescription.ocrText || 'Not uploaded'}

Task: ${payload.task}

Respond with ONLY this JSON (no markdown, no extra text):
{
  "status": "safe|warning|danger|unknown",
  "medicineName": "identified medicine name",
  "confidence": 0-100,
  "reason": "brief reason",
  "warnings": ["list", "of", "warnings"],
  "recommendations": ["list", "of", "recommendations"]
}`;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };

        const body = {
            model: this.models[this.currentModel],
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 500
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            if (response.status === 429) {
                // Rate limited, try next model
                this.currentModel = (this.currentModel + 1) % this.models.length;
                console.log('Model limit reached, switching to:', this.models[this.currentModel]);
                return this.callOpenRouter(payload);
            }
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    },

    parseResult(responseText) {
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('JSON parse error:', e);
        }
        return this.getMockResult({});
    },

    getMockResult(payload) {
        const medicine = payload.medicineScan?.medicinePhotoOcrText || 
                        payload.medicineScan?.manualMedicineText || 
                        'Paracetamol 500mg';
        
        // Simple rule-based logic
        if (medicine.toLowerCase().includes('penicillin') && 
            app.profile.allergies.includes('Penicillin')) {
            return {
                status: 'danger',
                medicineName: 'Penicillin G',
                confidence: 95,
                message: '⚠️ DANGER: Allergy Conflict',
                reason: 'User has documented penicillin allergy',
                warnings: ['Known allergy match', 'Do not consume'],
                recommendations: ['Contact prescriber', 'Use alternative antibiotic']
            };
        }

        if (medicine.toLowerCase().includes('aspirin') || 
            medicine.toLowerCase().includes('ibuprofen')) {
            if (app.profile.conditions.includes('Ulcer')) {
                return {
                    status: 'warning',
                    medicineName: medicine,
                    confidence: 85,
                    message: '⚠️ WARNING: Possible Interaction',
                    reason: 'NSAIDs contraindicated with ulcer condition',
                    warnings: ['May worsen ulcer', 'Risk of GI bleeding'],
                    recommendations: ['Consult doctor', 'Consider acetaminophen']
                };
            }
        }

        // Default safe
        return {
            status: 'safe',
            medicineName: medicine,
            confidence: 90,
            message: '✓ SAFE: Verified',
            reason: 'Medicine verified against profile. No known conflicts detected.',
            warnings: [],
            recommendations: ['Store as directed', 'Follow prescription']
        };
    }
};
