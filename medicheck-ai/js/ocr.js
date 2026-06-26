const ocr = {
    async extractMedicineOCR(file, callback) {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const worker = await Tesseract.createWorker();
                const { data: { text } } = await worker.recognize(e.target.result);
                await worker.terminate();
                callback(text);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('OCR error:', error);
            callback('OCR failed - manual entry required');
        }
    },

    async extractPrescriptionOCR(file, callback) {
        try {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const worker = await Tesseract.createWorker();
                    const { data: { text } } = await worker.recognize(e.target.result);
                    await worker.terminate();
                    callback(text);
                };
                reader.readAsArrayBuffer(file);
            } else {
                callback('PDF support requires additional library - please use image format or manual entry');
            }
        } catch (error) {
            console.error('Prescription OCR error:', error);
            callback('');
        }
    }
};
