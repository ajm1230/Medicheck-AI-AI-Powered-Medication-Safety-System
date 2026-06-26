const app = {
    currentMode: null,
    currentScreen: 'home',
    profile: {
        name: 'Judge Demo',
        age: '',
        allergies: [],
        conditions: [],
        currentMedicines: []
    },
    medicineData: {
        barcode: '',
        photo: null,
        ocrText: '',
        manualText: '',
        prescription: ''
    },
    reports: [],

    init() {
        this.loadProfile();
        this.updateNavigation();
        document.getElementById('startVerification').addEventListener('click', () => this.navigate('verify'));
    },

    startJudgeDemo() {
        this.currentMode = 'demo';
        this.profile = {
            name: 'Judge Demo',
            age: '30',
            allergies: ['Penicillin'],
            conditions: [],
            currentMedicines: []
        };
        this.closeLanding();
        document.getElementById('userStatus').textContent = 'Demo Mode';
        this.goHome();
    },

    startRealMode() {
        this.currentMode = 'real';
        this.closeLanding();
        document.getElementById('userStatus').textContent = 'Real Mode';
        this.navigate('profile');
    },

    closeLanding() {
        document.getElementById('landingPage').classList.add('hidden');
        this.init();
    },

    navigate(screen) {
        this.closeAllScreens();
        this.currentScreen = screen;
        
        switch(screen) {
            case 'home':
                this.showScreen('homeScreen');
                break;
            case 'verify':
                this.showScreen('verifyScreen');
                this.resetMedicineForm();
                break;
            case 'demo':
                this.showScreen('demoScreen');
                break;
            case 'profile':
                this.showScreen('profileScreen');
                this.loadProfileForm();
                break;
            case 'reports':
                this.showReports();
                break;
        }
        this.updateNavigation();
    },

    showScreen(screenId) {
        document.getElementById(screenId).classList.add('active');
    },

    closeAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    },

    goHome() {
        this.navigate('home');
        this.updateDashboard();
    },

    updateNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        switch(this.currentScreen) {
            case 'home':
                document.getElementById('navHome').classList.add('active');
                break;
            case 'verify':
                document.getElementById('navVerify').classList.add('active');
                break;
            case 'demo':
                document.getElementById('navDemo').classList.add('active');
                break;
            case 'profile':
                document.getElementById('navProfile').classList.add('active');
                break;
            case 'reports':
                document.getElementById('navReports').classList.add('active');
                break;
        }
    },

    updateDashboard() {
        document.getElementById('userName').textContent = this.profile.name;
        
        if (this.reports.length > 0) {
            const lastReport = this.reports[this.reports.length - 1];
            document.getElementById('safetyScore').textContent = lastReport.confidence + '%';
            
            let reportsHtml = '<h3>Recent Reports</h3>';
            this.reports.slice(-3).forEach(r => {
                reportsHtml += `<div class="card"><p><strong>${r.medicineName}</strong> - ${r.status.toUpperCase()}</p></div>`;
            });
            document.getElementById('recentReports').innerHTML = reportsHtml;
        }
    },

    loadProfile() {
        const saved = localStorage.getItem('medicheck_profile');
        if (saved) {
            this.profile = JSON.parse(saved);
        }
    },

    saveProfile() {
        this.profile.name = document.getElementById('profileName').value || 'User';
        this.profile.age = document.getElementById('profileAge').value || '';
        this.profile.allergies = document.getElementById('profileAllergies').value.split(',').map(a => a.trim()).filter(a => a);
        this.profile.conditions = document.getElementById('profileConditions').value.split(',').map(c => c.trim()).filter(c => c);
        
        localStorage.setItem('medicheck_profile', JSON.stringify(this.profile));
        alert('Profile saved!');
        this.goHome();
    },

    loadProfileForm() {
        document.getElementById('profileName').value = this.profile.name;
        document.getElementById('profileAge').value = this.profile.age;
        document.getElementById('profileAllergies').value = this.profile.allergies.join(', ');
        document.getElementById('profileConditions').value = this.profile.conditions.join(', ');
    },

    resetMedicineForm() {
        this.medicineData = {
            barcode: '',
            photo: null,
            ocrText: '',
            manualText: '',
            prescription: ''
        };
        document.getElementById('barcodeInput').value = '';
        document.getElementById('medicinePhotoInput').value = '';
        document.getElementById('medicineOcrText').value = '';
        document.getElementById('medicineManualInput').value = '';
        document.getElementById('prescriptionOcrText').value = '';
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('barcodeStatus').textContent = '';
    },

    startScanner() {
        scanner.init();
    },

    processMedicinePhoto(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.medicineData.photo = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('photoPreview').innerHTML = `<img src="${e.target.result}" alt="Medicine">`;
        };
        reader.readAsDataURL(file);
        
        ocr.extractMedicineOCR(file, (text) => {
            this.medicineData.ocrText = text;
            document.getElementById('medicineOcrText').value = text;
        });
    },

    processPrescription(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        ocr.extractPrescriptionOCR(file, (text) => {
            this.medicineData.prescription = text;
            document.getElementById('prescriptionOcrText').value = text;
        });
    },

    async analyzeMedicine() {
        const medicineName = this.medicineData.manualText || this.medicineData.ocrText || 'Unknown';
        
        if (!medicineName) {
            alert('Please provide medicine name or upload photo');
            return;
        }

        const payload = {
            userProfile: this.profile,
            prescription: {
                uploaded: !!this.medicineData.prescription,
                ocrText: this.medicineData.prescription
            },
            medicineScan: {
                barcodeText: this.medicineData.barcode,
                medicinePhotoOcrText: this.medicineData.ocrText,
                manualMedicineText: this.medicineData.manualText
            },
            task: 'Verify if medicine is safe for user profile'
        };

        const result = await ai.analyze(payload);
        this.displayResult(result);
        
        this.reports.push({
            medicineName,
            status: result.status,
            confidence: result.confidence,
            timestamp: new Date().toLocaleString()
        });
        localStorage.setItem('medicheck_reports', JSON.stringify(this.reports));
    },

    displayResult(result) {
        const statusDiv = document.getElementById('resultStatus');
        const detailsDiv = document.getElementById('resultDetails');
        
        statusDiv.textContent = result.message;
        statusDiv.className = 'result-status ' + result.status;
        
        detailsDiv.innerHTML = `
            <p><strong>Medicine:</strong> ${result.medicineName}</p>
            <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
            <p><strong>Confidence:</strong> ${result.confidence}%</p>
            <p><strong>Reason:</strong> ${result.reason}</p>
            ${result.warnings && result.warnings.length > 0 ? `<p><strong>Warnings:</strong> ${result.warnings.join(', ')}</p>` : ''}
            ${result.recommendations && result.recommendations.length > 0 ? `<p><strong>Recommendations:</strong> ${result.recommendations.join(', ')}</p>` : ''}
        `;
        
        this.closeAllScreens();
        this.showScreen('resultsScreen');
        this.currentScreen = 'results';
        this.updateNavigation();
    },

    generateReport() {
        const report = this.reports[this.reports.length - 1];
        const reportText = `
MediCheck AI Report
==================
Medicine: ${report.medicineName}
Status: ${report.status.toUpperCase()}
Confidence: ${report.confidence}%
Timestamp: ${report.timestamp}

Profile: ${this.profile.name}
Allergies: ${this.profile.allergies.join(', ') || 'None'}
Conditions: ${this.profile.conditions.join(', ') || 'None'}
        `;
        
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medicheck_report_${Date.now()}.txt`;
        a.click();
    },

    runDemo(demoId) {
        const demoData = demo.getDemoCase(demoId);
        this.medicineData = demoData.medicineData;
        this.displayResult(demoData.result);
    },

    showReports() {
        this.closeAllScreens();
        const reportsScreen = document.createElement('div');
        reportsScreen.className = 'screen active';
        reportsScreen.innerHTML = `
            <div class="header-back">
                <button class="back-btn" onclick="app.goHome()">← Back</button>
                <h2>Reports</h2>
            </div>
            <div style="max-width: 600px; margin: 0 auto;">
                ${this.reports.length === 0 ? '<p style="text-align: center; color: #7f8c8d;">No reports yet</p>' : ''}
                ${this.reports.map((r, i) => `
                    <div class="card">
                        <p><strong>${r.medicineName}</strong></p>
                        <p>Status: <span style="color: ${r.status === 'safe' ? '#26de81' : r.status === 'warning' ? '#ffa502' : '#ff4757'}">${r.status.toUpperCase()}</span></p>
                        <p>Confidence: ${r.confidence}%</p>
                        <p style="font-size: 0.9rem; color: #7f8c8d;">${r.timestamp}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        const app_div = document.getElementById('app');
        app_div.innerHTML = '';
        app_div.appendChild(reportsScreen);
        this.updateNavigation();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const landing = document.getElementById('landingPage');
        landing.classList.remove('hidden');
    }, 100);
});
