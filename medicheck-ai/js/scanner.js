const scanner = {
    isScanning: false,

    init() {
        const scannerDiv = document.getElementById('scanner-wrapper');
        const scanner_elem = document.getElementById('scanner');
        
        if (scanner_elem.style.display !== 'none') {
            this.stop();
            return;
        }

        scanner_elem.style.display = 'block';
        
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scanner_elem,
                constraints: {
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "upc_reader",
                    "qr_reader",
                    "code_39_reader"
                ]
            }
        }, (err) => {
            if (err) {
                console.log("Init error:", err);
                alert('Camera access denied or not available');
                scanner_elem.style.display = 'none';
                return;
            }
            Quagga.start();
            this.isScanning = true;
        });

        Quagga.onDetected((data) => {
            const barcode = data.codeResult.code;
            if (barcode) {
                document.getElementById('barcodeInput').value = barcode;
                document.getElementById('barcodeStatus').textContent = '✓ Barcode detected: ' + barcode;
                this.stop();
            }
        });
    },

    stop() {
        if (this.isScanning) {
            Quagga.stop();
            this.isScanning = false;
            document.getElementById('scanner').style.display = 'none';
        }
    }
};
