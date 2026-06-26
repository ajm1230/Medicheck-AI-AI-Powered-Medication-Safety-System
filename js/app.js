(function(){
  "use strict";

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const storageKey = "medicheck-ai-webapp-v1";

  const icons = {
    bell:'<svg class="icon" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    scan:'<svg class="icon" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
    file:'<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>',
    shield:'<svg class="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-5"/></svg>',
    volume:'<svg class="icon" viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    back:'<svg class="icon" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
    spark:'<svg class="icon" viewBox="0 0 24 24"><path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg>',
    qr:'<svg class="icon" viewBox="0 0 24 24"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M3 14h7v7H3z"/><path d="M14 14h2v2h-2z"/><path d="M18 14h3v3"/><path d="M14 18h3v3"/><path d="M20 20h1"/></svg>',
    camera:'<svg class="icon" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="4"/></svg>',
    bolt:'<svg class="icon" viewBox="0 0 24 24"><path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg>',
    home:'<svg class="icon" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    history:'<svg class="icon" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/><path d="M12 7v6l4 2"/></svg>',
    plus:'<svg class="icon" viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    user:'<svg class="icon" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
    trash:'<svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>'
  };

  const defaultState = {
    mode: "guest",
    view: "onboarding",
    profile: { name:"", email:"", age:"", allergies:"", conditions:"", currentMeds:"" },
    history: [],
    currentReport: null,
    settings: {
      provider:"local",
      apiKey:"",
      model:"mistralai/mistral-7b-instruct:free",
      language:"hinglish",
      autoSave:true,
      confidence:true
    }
  };

  let state = loadState();
  let selectedMedicineImage = null;
  let selectedBarcodeImage = null;
  let selectedPrescriptionImage = null;
  let pendingConfirm = null;

  function loadState(){
    try{
      const raw = localStorage.getItem(storageKey);
      if(!raw) return structuredClone(defaultState);
      return mergeDeep(structuredClone(defaultState), JSON.parse(raw));
    }catch(error){
      console.warn("State load failed", error);
      return structuredClone(defaultState);
    }
  }

  function saveState(){
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function mergeDeep(target, source){
    for(const key of Object.keys(source || {})){
      if(source[key] && typeof source[key] === "object" && !Array.isArray(source[key])){
        target[key] = mergeDeep(target[key] || {}, source[key]);
      }else{
        target[key] = source[key];
      }
    }
    return target;
  }

  function escapeHTML(value){
    return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  }

  function normalize(value){
    return String(value || "").toLowerCase().replace(/[^a-z0-9\s.-]/g," ").replace(/\s+/g," ").trim();
  }

  function includesAny(text, words){
    const hay = normalize(text);
    return (words || []).some(word => hay.includes(normalize(word)) && normalize(word).length > 0);
  }

  function splitTags(value){
    return normalize(value).split(/[;,\n]| and |\+/).map(v => v.trim()).filter(Boolean);
  }

  function init(){
    renderIcons();
    setupClock();
    setupEvents();
    populateCases();
    populateFields();
    renderAll();
    goTo(state.view || (state.mode === "guest" ? "onboarding" : "home"), {silent:true});
  }

  function renderIcons(){
    $$('[data-icon]').forEach(el => {
      const key = el.getAttribute('data-icon');
      el.innerHTML = icons[key] || '';
    });
  }

  function setupClock(){
    const update = () => {
      const now = new Date();
      $('#clock').textContent = now.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
    };
    update();
    setInterval(update, 30000);
  }

  function setupEvents(){
    document.addEventListener('click', event => {
      const actionEl = event.target.closest('[data-action]');
      const navEl = event.target.closest('[data-nav]');
      if(actionEl) handleAction(actionEl.getAttribute('data-action'), actionEl);
      if(navEl) goTo(navEl.getAttribute('data-nav'));
    });

    $('#medicineFile').addEventListener('change', event => handleImageFile(event, 'medicine'));
    $('#barcodeFile').addEventListener('change', event => handleImageFile(event, 'barcode'));
    $('#prescriptionFile').addEventListener('change', event => handleImageFile(event, 'prescription'));
    $('#providerSelect').addEventListener('change', () => state.settings.provider = $('#providerSelect').value);
  }

  function handleAction(action, el){
    const actions = {
      'start-judge': startJudgeMode,
      'start-real': startRealMode,
      'start-scan': () => goTo('scan'),
      'go-home': () => goTo('home'),
      'go-scan': () => goTo('scan'),
      'go-history': () => goTo('history'),
      'go-profile': () => goTo('profile'),
      'go-prescription': () => goTo('prescription'),
      'open-settings': () => goTo('settings'),
      'clear-scan': clearScan,
      'trigger-medicine-file': () => $('#medicineFile').click(),
      'trigger-barcode-file': () => $('#barcodeFile').click(),
      'run-ocr': () => runMedicineOCR(),
      'run-prescription-ocr': () => runPrescriptionOCR(),
      'analyze-medicine': analyzeFromForm,
      'save-profile': saveProfile,
      'demo-profile': fillDemoProfile,
      'save-settings': saveSettings,
      'toggle-autosave': () => toggleSetting('autoSave', '#autosaveToggle'),
      'toggle-confidence': () => toggleSetting('confidence', '#confidenceToggle'),
      'load-safe-case': () => loadJudgeCase('case-safe'),
      'speak-report': speakCurrentReport,
      'voice-last': speakCurrentReport,
      'clear-history': confirmClearHistory,
      'export-history': exportHistory,
      'share-report': shareReport,
      'save-report': saveCurrentReport,
      'export-report': exportCurrentReport,
      'use-prescription-text': usePrescriptionText,
      'reset-app': confirmResetApp,
      'modal-cancel': closeModal,
      'modal-confirm': runPendingConfirm
    };

    if(action === 'select-case'){
      loadJudgeCase(el.getAttribute('data-case'));
      return;
    }
    if(action === 'open-report'){
      const id = el.getAttribute('data-report-id');
      openReport(id);
      return;
    }
    if(actions[action]) actions[action]();
  }

  function startJudgeMode(){
    state.mode = 'judge';
    state.profile = {
      name:"Judge Demo",
      email:"demo@medicheck.ai",
      age:"23",
      allergies:"none",
      conditions:"none",
      currentMeds:"none"
    };
    state.view = 'home';
    saveState();
    populateFields();
    renderAll();
    goTo('home');
    toast('Judge Demo Mode active — no login required');
  }

  function startRealMode(){
    state.mode = 'real';
    state.view = state.profile.name ? 'home' : 'profile';
    saveState();
    renderAll();
    goTo(state.view);
    toast(state.profile.name ? 'Real Mode active' : 'Add your local profile');
  }

  function goTo(view, options={}){
    if(state.mode === 'guest' && view !== 'onboarding'){
      view = 'onboarding';
    }
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
    $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-nav') === view));
    $('#bottomNav').classList.toggle('hidden', view === 'onboarding');
    state.view = view;
    if(!options.silent) saveState();
    renderAll();
  }

  function populateFields(){
    $('#profileName').value = state.profile.name || '';
    $('#profileAge').value = state.profile.age || '';
    $('#profileEmail').value = state.profile.email || '';
    $('#profileAllergies').value = state.profile.allergies || '';
    $('#profileConditions').value = state.profile.conditions || '';
    $('#profileMeds').value = state.profile.currentMeds || '';
    $('#providerSelect').value = state.settings.provider || 'local';
    $('#apiKey').value = state.settings.apiKey || '';
    $('#modelName').value = state.settings.model || '';
  }

  function renderAll(){
    renderHome();
    renderProfileTags();
    renderHistory();
    renderReport();
    renderSettings();
    $('#judgeCasesBlock').classList.toggle('hidden', state.mode !== 'judge');
  }

  function renderHome(){
    const name = state.profile.name || (state.mode === 'judge' ? 'Judge' : 'User');
    $('#helloName').textContent = `Hello, ${name.split(' ')[0] || name}`;
    $('#modeLine').textContent = state.mode === 'judge' ? 'Judge Demo Mode • No login needed' : 'Your AI Medical Verifier';
    const history = state.history || [];
    $('#scanCount').textContent = history.length;
    $('#safeCount').textContent = history.filter(r => r.status === 'safe').length;
    $('#riskCount').textContent = history.filter(r => r.status !== 'safe').length;

    const recentList = $('#recentList');
    if(!history.length){
      recentList.innerHTML = '<div class="empty-state">No reports yet. Tap the center + button to scan your first medicine.</div>';
      return;
    }
    recentList.innerHTML = history.slice(0,3).map(reportRowHTML).join('');
  }

  function renderHistory(){
    const list = $('#historyList');
    const history = state.history || [];
    if(!history.length){
      list.innerHTML = '<div class="empty-state">History is empty. Reports are saved locally in this browser.</div>';
      return;
    }
    list.innerHTML = history.map(reportRowHTML).join('');
  }

  function reportRowHTML(report){
    const pillClass = report.status === 'safe' ? 'safe' : report.status === 'warning' ? 'warn' : 'danger';
    const label = report.status === 'safe' ? 'Safe' : report.status === 'warning' ? 'Caution' : 'Danger';
    return `<button class="medicine-row" data-action="open-report" data-report-id="${escapeHTML(report.id)}">
      <span class="mini-box"></span>
      <span class="med-text"><b>${escapeHTML(report.medicineName || 'Unknown medicine')}</b><span>${escapeHTML(report.createdAtLabel || '')} • ${escapeHTML(report.summaryShort || '')}</span></span>
      <span class="pill ${pillClass}">${label}</span><span class="chev">›</span>
    </button>`;
  }

  function renderProfileTags(){
    const target = $('#riskTags');
    const tags = [...splitTags(state.profile.allergies), ...splitTags(state.profile.conditions), ...splitTags(state.profile.currentMeds)];
    if(!tags.length || tags.every(t => t === 'none')){
      target.innerHTML = '<span class="tag">No risk tags added</span>';
      return;
    }
    target.innerHTML = tags.filter(t => t !== 'none').map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('');
  }

  function renderSettings(){
    $('#autosaveToggle').classList.toggle('on', !!state.settings.autoSave);
    $('#confidenceToggle').classList.toggle('on', !!state.settings.confidence);
    $$('#languagePills [data-lang]').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === state.settings.language));
  }

  function populateCases(){
    const strip = $('#caseStrip');
    strip.innerHTML = window.MEDICHECK_DB.judgeCases.map(c => `<button class="case-btn" data-action="select-case" data-case="${c.id}"><b>${escapeHTML(c.title)}</b><span>${escapeHTML(c.badge)}</span></button>`).join('');
  }

  function loadJudgeCase(id){
    const c = window.MEDICHECK_DB.judgeCases.find(item => item.id === id) || window.MEDICHECK_DB.judgeCases[0];
    state.profile = {...c.patient};
    $('#medicineText').value = c.medicineText;
    $('#barcodeText').value = c.barcodeText;
    $('#prescriptionText').value = c.prescriptionText;
    $('#symptomText').value = c.symptomText;
    $$('.case-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.case === c.id));
    populateFields();
    renderProfileTags();
    goTo('scan');
    toast(`${c.title} loaded`);
  }

  function clearScan(){
    $('#medicineText').value = '';
    $('#barcodeText').value = '';
    $('#prescriptionText').value = '';
    $('#symptomText').value = '';
    $('#medicineFile').value = '';
    $('#barcodeFile').value = '';
    selectedMedicineImage = null;
    selectedBarcodeImage = null;
    $('#cameraPreview').style.backgroundImage = '';
    $('#cameraPreview .medicine-image')?.classList.remove('hidden');
    $('#scanCaption').textContent = 'Align medicine pack in frame';
    toast('Scan form cleared');
  }

  function handleImageFile(event, type){
    const file = event.target.files?.[0];
    if(!file) return;
    if(file.type === 'application/pdf'){
      toast('PDF OCR is not enabled in this static prototype. Paste text or upload image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataURL = reader.result;
      if(type === 'medicine'){
        selectedMedicineImage = dataURL;
        $('#cameraPreview').style.backgroundImage = `url(${dataURL})`;
        $('#cameraPreview .medicine-image')?.classList.add('hidden');
        $('#scanCaption').textContent = 'Photo added • tap OCR/Verify';
        runMedicineOCR(true);
      }else if(type === 'barcode'){
        selectedBarcodeImage = dataURL;
        readBarcodeImage(dataURL);
      }else if(type === 'prescription'){
        selectedPrescriptionImage = dataURL;
        runPrescriptionOCR(true);
      }
    };
    reader.readAsDataURL(file);
  }

  async function readBarcodeImage(dataURL){
    if(!('BarcodeDetector' in window)){
      toast('BarcodeDetector unavailable. Type code manually or use demo case.');
      return;
    }
    try{
      const detector = new BarcodeDetector({formats:['qr_code','ean_13','ean_8','code_128','code_39','upc_a','upc_e']});
      const img = await imageFromDataURL(dataURL);
      const results = await detector.detect(img);
      if(results.length){
        $('#barcodeText').value = results.map(r => r.rawValue).join('\n');
        toast('Barcode/QR detected');
      }else{
        toast('No barcode found. You can type QR data manually.');
      }
    }catch(error){
      console.warn(error);
      toast('Barcode scan failed. Manual field is available.');
    }
  }

  function imageFromDataURL(dataURL){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataURL;
    });
  }

  async function runMedicineOCR(silent=false){
    if(!selectedMedicineImage){
      if(!silent) toast('Upload/take a medicine photo first');
      return;
    }
    const text = await runOCR(selectedMedicineImage, '#ocrProgress');
    if(text){
      $('#medicineText').value = compactOCR(text, $('#medicineText').value);
      toast('Medicine OCR completed');
    }
  }

  async function runPrescriptionOCR(silent=false){
    if(!selectedPrescriptionImage){
      if(!silent) toast('Upload prescription image first');
      return;
    }
    const text = await runOCR(selectedPrescriptionImage, '#rxProgress');
    if(text){
      $('#rxOutput').value = compactOCR(text, $('#rxOutput').value);
      toast('Prescription OCR completed');
    }
  }

  function compactOCR(newText, existing){
    const text = String(newText || '').replace(/\s+/g,' ').trim();
    if(!text) return existing || '';
    return existing ? `${existing}\n${text}` : text;
  }

  function loadTesseract(){
    return new Promise((resolve, reject) => {
      if(window.Tesseract) return resolve(window.Tesseract);
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => reject(new Error('Tesseract.js CDN failed'));
      document.head.appendChild(script);
    });
  }

  async function runOCR(dataURL, progressSelector){
    const progress = $(progressSelector);
    progress.classList.remove('hidden');
    const bar = $('span', progress);
    bar.style.width = '5%';
    try{
      const Tesseract = await loadTesseract();
      const result = await Tesseract.recognize(dataURL, 'eng', {
        logger: m => {
          if(m.status === 'recognizing text') bar.style.width = `${Math.round((m.progress || 0) * 100)}%`;
        }
      });
      bar.style.width = '100%';
      setTimeout(() => progress.classList.add('hidden'), 700);
      return result?.data?.text || '';
    }catch(error){
      console.warn(error);
      progress.classList.add('hidden');
      toast('OCR CDN not loaded. Paste/type text manually.');
      return '';
    }
  }

  async function analyzeFromForm(){
    const input = {
      medicineText: $('#medicineText').value,
      barcodeText: $('#barcodeText').value,
      prescriptionText: $('#prescriptionText').value,
      symptomText: $('#symptomText').value,
      profile: {...state.profile},
      mode: state.mode
    };
    if(!input.medicineText && !input.barcodeText){
      toast('Add medicine text/photo or barcode first');
      return;
    }
    toast('Analyzing medicine safety...');
    let report = null;
    if(state.settings.provider !== 'local' && state.settings.apiKey){
      try{
        report = await analyzeWithAI(input);
      }catch(error){
        console.warn('AI failed, using local engine', error);
        toast('AI unavailable — fallback local engine used');
      }
    }
    if(!report) report = localAnalyze(input);
    state.currentReport = report;
    if(state.settings.autoSave) saveCurrentReport(true);
    renderAll();
    goTo('report');
  }

  function localAnalyze(input){
    const db = window.MEDICHECK_DB.medicines;
    const allText = `${input.medicineText}\n${input.barcodeText}`;
    let med = db.find(m => includesAny(input.barcodeText, m.barcodes)) || db.find(m => includesAny(allText, [m.name, m.generic, ...m.aliases]));
    let score = 92;
    const checks = [];
    const recommendations = [];
    const flags = [];
    const profileText = `${input.profile.allergies} ${input.profile.conditions} ${input.profile.currentMeds}`;
    const rxText = input.prescriptionText || '';
    const symptomText = input.symptomText || '';
    let confidence = 86;

    if(!med){
      med = { name:"Unknown medicine", generic:"Unknown", className:"Not recognized", strength:"Unknown", aliases:[], barcodes:[], avoidIf:[], allergyTags:[], interactions:[], commonUse:[] };
      score -= 30;
      confidence = 42;
      flags.push('unknown');
      checks.push(check('OCR recognized', 'warn', 'Medicine name was not confidently matched. Add clearer photo or exact text.'));
      recommendations.push('Do not rely only on barcode. Upload a clearer full pack photo or ask pharmacist to verify.');
    }else{
      checks.push(check('OCR recognized', 'ok', `${med.name} detected with ${confidence}% local confidence.`));
    }

    if(input.barcodeText){
      const barcodeMatch = med.barcodes?.some(code => normalize(input.barcodeText).includes(normalize(code)));
      if(barcodeMatch){
        checks.push(check('Barcode / QR check', 'ok', 'Barcode/QR matches the local trusted sample database.'));
      }else{
        score -= 22;
        flags.push('barcode-mismatch');
        checks.push(check('Barcode / QR check', 'bad', 'Barcode/QR did not match known medicine data. Fake or wrong-pack risk exists.'));
        recommendations.push('If barcode and packaging do not match, avoid taking the medicine until a pharmacist verifies it.');
      }
    }else{
      score -= 5;
      checks.push(check('Barcode / QR check', 'warn', 'No barcode/QR data was provided. Photo OCR and prescription rules were used.'));
    }

    if(rxText){
      const rxHasMed = includesAny(rxText, [med.name, med.generic, ...(med.aliases || [])]);
      if(rxHasMed){
        checks.push(check('Prescription match', 'ok', 'Prescription text contains the detected medicine/generic name.'));
      }else{
        score -= 26;
        flags.push('rx-mismatch');
        checks.push(check('Prescription match', 'bad', 'Scanned medicine does not clearly match the prescription text.'));
        recommendations.push('Match the medicine name and strength with the prescription before taking it.');
      }
      if(med.strength !== 'Unknown' && !normalize(rxText).includes(normalize(med.strength))){
        score -= 8;
        checks.push(check('Dose / strength check', 'warn', `Detected strength ${med.strength}; prescription strength was not clearly confirmed.`));
      }else if(med.strength !== 'Unknown'){
        checks.push(check('Dose / strength check', 'ok', `Strength ${med.strength} is visible in medicine/prescription data.`));
      }
    }else{
      score -= 10;
      checks.push(check('Prescription match', 'warn', 'No prescription text added. Only medicine/profile checks were completed.'));
    }

    const allergyHit = (med.allergyTags || []).find(tag => normalize(profileText).includes(normalize(tag))) || (med.avoidIf || []).find(tag => normalize(profileText).includes(normalize(tag)));
    if(allergyHit){
      score -= 48;
      flags.push('allergy');
      checks.push(check('Allergy check', 'bad', `Patient profile contains risk tag: ${allergyHit}.`));
      recommendations.push('High risk: do not take this medicine without doctor/pharmacist confirmation.');
    }else{
      checks.push(check('Allergy check', 'ok', 'No direct allergy conflict found in the current profile.'));
    }

    const interactionHit = (med.interactions || []).find(drug => normalize(profileText).includes(normalize(drug)) || normalize(rxText).includes(normalize(drug)));
    if(interactionHit){
      score -= 28;
      flags.push('interaction');
      checks.push(check('Interaction check', 'bad', `Possible interaction found with ${interactionHit}.`));
      recommendations.push(`Discuss ${interactionHit} interaction risk with a doctor/pharmacist.`);
    }else{
      checks.push(check('Interaction check', 'ok', 'No major interaction found in sample rules.'));
    }

    const conditionHit = (med.avoidIf || []).find(condition => normalize(profileText).includes(normalize(condition)));
    if(conditionHit && conditionHit !== allergyHit){
      score -= 25;
      flags.push('condition');
      checks.push(check('Disease/condition check', 'bad', `Profile condition may conflict: ${conditionHit}.`));
      recommendations.push('Condition conflict detected. Take medical advice before use.');
    }else{
      checks.push(check('Disease/condition check', 'ok', 'No direct disease/condition conflict found.'));
    }

    const textAll = normalize(`${allText} ${rxText}`);
    const expired = /exp|expiry|expires|use before/.test(textAll) && /(2020|2021|2022|2023|2024|01\/2024|02\/2024|03\/2024|04\/2024|05\/2024|06\/2024|07\/2024|08\/2024|09\/2024|10\/2024|11\/2024|12\/2024)/.test(textAll);
    const tamper = /broken seal|blurry print|mismatch|fake|duplicate|tamper|damaged/.test(textAll);
    if(expired || tamper){
      score -= expired ? 45 : 24;
      flags.push(expired ? 'expired' : 'tamper');
      checks.push(check('Fake/expiry check', 'bad', expired ? 'Expired date risk found in OCR text.' : 'Packaging/tamper warning found in OCR text.'));
      recommendations.push('Do not consume medicine with expired date, broken seal, or suspicious packaging.');
    }else{
      checks.push(check('Fake/expiry check', 'ok', 'No expiry/tamper warning detected from provided text.'));
    }

    if(symptomText && med.commonUse?.length){
      const symptomMatch = includesAny(symptomText, med.commonUse);
      if(symptomMatch){
        checks.push(check('Use-case match', 'ok', 'Medicine use appears compatible with the given symptom category.'));
      }else{
        score -= 9;
        checks.push(check('Use-case match', 'warn', 'Symptom does not strongly match the medicine common-use sample rules.'));
      }
    }

    score = Math.max(5, Math.min(99, Math.round(score)));
    const status = score >= 78 && !flags.includes('allergy') && !flags.includes('expired') && !flags.includes('rx-mismatch') ? 'safe' : score >= 45 && !flags.includes('allergy') && !flags.includes('expired') ? 'warning' : 'danger';
    const title = status === 'safe' ? 'Safe' : status === 'warning' ? 'Caution' : 'Danger';
    const summaryShort = status === 'safe' ? 'Looks compatible' : status === 'warning' ? 'Needs pharmacist check' : 'Do not take yet';
    if(!recommendations.length){
      recommendations.push('Take medicine only according to the doctor prescription and correct dose schedule.');
      recommendations.push('Keep the report and ask a pharmacist if any doubt remains.');
    }

    return enrichReport({
      id: cryptoRandomId(),
      source: state.settings.provider === 'local' ? 'Local Safety Engine' : 'AI fallback + Local Safety Engine',
      mode: state.mode,
      status,
      title,
      score,
      confidence,
      medicineName: med.name,
      generic: med.generic,
      medicineClass: med.className,
      strength: med.strength,
      summaryShort,
      patientName: input.profile.name || 'User',
      checks,
      recommendations,
      explanation: buildExplanation(status, med, flags),
      inputSnapshot: input,
      createdAt: new Date().toISOString()
    });
  }

  function check(title, level, detail){
    return {title, level, detail};
  }

  function buildExplanation(status, med, flags){
    if(status === 'safe') return `${med.name} appears to match the prescription/profile data provided. No major allergy, interaction, or fake/expiry warning was found by the prototype rules.`;
    if(flags.includes('allergy')) return `Major allergy conflict detected for ${med.name}. This is a high-risk result and the patient should avoid taking it until confirmed by a qualified professional.`;
    if(flags.includes('rx-mismatch')) return `The detected medicine does not clearly match the prescription. Wrong medicine mistakes can happen at pharmacy/patient handover, so verification is required.`;
    if(flags.includes('barcode-mismatch')) return `Barcode/QR data did not match the detected medicine database. This can indicate wrong pack data, fake risk, or unsupported product data.`;
    return `${med.name} has one or more caution signals. The app recommends pharmacist/doctor verification before use.`;
  }

  function enrichReport(report){
    const date = new Date(report.createdAt);
    report.createdAtLabel = date.toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
    return report;
  }

  async function analyzeWithAI(input){
    const prompt = `You are MediCheck AI, a medication safety prototype. Return ONLY valid JSON with this schema: {"status":"safe|warning|danger","score":0-100,"confidence":0-100,"medicineName":"","generic":"","strength":"","summaryShort":"","explanation":"","checks":[{"title":"","level":"ok|warn|bad","detail":""}],"recommendations":[""]}. Analyze medicine OCR/barcode/prescription/profile. Use cautious safety logic. Input: ${JSON.stringify(input)}`;
    let data;
    if(state.settings.provider === 'openrouter'){
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${state.settings.apiKey}`,
          'HTTP-Referer': location.href,
          'X-Title':'MediCheck AI Prototype'
        },
        body: JSON.stringify({ model: state.settings.model || 'mistralai/mistral-7b-instruct:free', messages:[{role:'user', content:prompt}], temperature:0.15 })
      });
      if(!res.ok) throw new Error(`OpenRouter ${res.status}`);
      data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      return normalizeAIReport(parseJSONFromText(text), input, 'OpenRouter AI');
    }
    if(state.settings.provider === 'gemini'){
      const model = state.settings.model || 'gemini-1.5-flash';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(state.settings.apiKey)}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.15}})
      });
      if(!res.ok) throw new Error(`Gemini ${res.status}`);
      data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
      return normalizeAIReport(parseJSONFromText(text), input, 'Gemini AI');
    }
    throw new Error('No AI provider selected');
  }

  function parseJSONFromText(text){
    const cleaned = String(text).replace(/```json|```/g,'').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if(start < 0 || end < start) throw new Error('No JSON in AI response');
    return JSON.parse(cleaned.slice(start, end + 1));
  }

  function normalizeAIReport(ai, input, source){
    const status = ['safe','warning','danger'].includes(ai.status) ? ai.status : 'warning';
    return enrichReport({
      id: cryptoRandomId(),
      source,
      mode: state.mode,
      status,
      title: status === 'safe' ? 'Safe' : status === 'warning' ? 'Caution' : 'Danger',
      score: Number(ai.score || 55),
      confidence: Number(ai.confidence || 72),
      medicineName: ai.medicineName || 'AI detected medicine',
      generic: ai.generic || '',
      medicineClass: ai.medicineClass || '',
      strength: ai.strength || '',
      summaryShort: ai.summaryShort || (status === 'safe' ? 'Looks compatible' : 'Review needed'),
      patientName: input.profile.name || 'User',
      checks: Array.isArray(ai.checks) ? ai.checks : [],
      recommendations: Array.isArray(ai.recommendations) ? ai.recommendations : ['Verify with a qualified healthcare professional.'],
      explanation: ai.explanation || 'AI analysis completed.',
      inputSnapshot: input,
      createdAt: new Date().toISOString()
    });
  }

  function renderReport(){
    const target = $('#reportContent');
    const r = state.currentReport;
    if(!r){
      target.innerHTML = '<div class="empty-state">No report yet. Scan a medicine or load a judge demo case.</div>';
      return;
    }
    const heroClass = r.status === 'safe' ? '' : r.status === 'warning' ? 'warn' : 'danger';
    const statusIcon = r.status === 'safe' ? '✓' : r.status === 'warning' ? '!' : '×';
    const scoreColor = r.status === 'safe' ? 'var(--green)' : r.status === 'warning' ? 'var(--yellow)' : 'var(--red)';
    const confidenceHTML = state.settings.confidence ? `<p><b>Source:</b> ${escapeHTML(r.source)} • <b>Confidence:</b> ${escapeHTML(r.confidence)}%</p>` : '';
    target.innerHTML = `
      <div class="report-hero ${heroClass}">
        <div class="status-icon">${statusIcon}</div>
        <div class="report-main"><p>Overall Safety</p><h2>${escapeHTML(r.title)}</h2><p>${escapeHTML(r.summaryShort)}</p></div>
        <div class="score-ring" style="--score:${Math.max(1, Math.min(99, r.score))}; background: conic-gradient(${scoreColor} calc(${r.score} * 1%), #e9f1fa 0);"><b>${escapeHTML(r.score)}</b><span>/100</span></div>
      </div>
      <div class="check-list">${(r.checks || []).map(checkHTML).join('')}</div>
      <div class="ai-box"><h3>✦ AI Recommendation</h3><p>${escapeHTML(r.explanation)}</p>${confidenceHTML}<ul>${(r.recommendations || []).map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul></div>
      <div class="report-actions"><button class="secondary-btn" data-action="share-report"><span data-icon="file"></span> Share</button><button class="primary-btn" data-action="save-report"><span data-icon="shield"></span> Save</button></div>
      <div class="report-actions" style="margin-top:10px"><button class="secondary-btn" data-action="speak-report"><span data-icon="volume"></span> Speak Report</button><button class="secondary-btn" data-action="export-report"><span data-icon="file"></span> Export TXT</button></div>
      <p class="disclaimer">${window.MEDICHECK_DB.disclaimers.map(escapeHTML).join(' ')}</p>
    `;
    renderIcons();
  }

  function checkHTML(item){
    const level = item.level === 'ok' ? 'ok' : item.level === 'bad' ? 'bad' : 'warn';
    const symbol = level === 'ok' ? '✓' : level === 'bad' ? '×' : '!';
    return `<div class="check-card"><span class="check-icon">${symbol}</span><span><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(item.detail)}</p></span><span class="check-status ${level}">${symbol}</span></div>`;
  }

  function saveCurrentReport(silent=false){
    const r = state.currentReport;
    if(!r){
      if(!silent) toast('No report to save');
      return;
    }
    const exists = state.history.some(item => item.id === r.id);
    if(!exists) state.history.unshift(r);
    state.history = state.history.slice(0, 50);
    saveState();
    renderHome();
    renderHistory();
    if(!silent) toast('Report saved to local history');
  }

  function openReport(id){
    const report = state.history.find(item => item.id === id);
    if(report){
      state.currentReport = report;
      saveState();
      renderReport();
      goTo('report');
    }
  }

  function saveProfile(){
    state.profile = {
      name: $('#profileName').value.trim(),
      age: $('#profileAge').value.trim(),
      email: $('#profileEmail').value.trim(),
      allergies: $('#profileAllergies').value.trim(),
      conditions: $('#profileConditions').value.trim(),
      currentMeds: $('#profileMeds').value.trim()
    };
    if(!state.profile.name && state.mode === 'real'){
      toast('Name is required for Real Mode profile');
      return;
    }
    if(state.mode === 'guest') state.mode = 'real';
    saveState();
    renderAll();
    toast('Profile saved locally');
    goTo('home');
  }

  function fillDemoProfile(){
    $('#profileName').value = 'Judge Demo';
    $('#profileAge').value = '23';
    $('#profileEmail').value = 'demo@medicheck.ai';
    $('#profileAllergies').value = 'penicillin allergy';
    $('#profileConditions').value = 'none';
    $('#profileMeds').value = 'none';
    toast('Demo profile filled');
  }

  function saveSettings(){
    state.settings.provider = $('#providerSelect').value;
    state.settings.apiKey = $('#apiKey').value.trim();
    state.settings.model = $('#modelName').value.trim() || (state.settings.provider === 'gemini' ? 'gemini-1.5-flash' : 'mistralai/mistral-7b-instruct:free');
    saveState();
    toast('Settings saved locally');
  }

  function toggleSetting(key, selector){
    state.settings[key] = !state.settings[key];
    $(selector).classList.toggle('on', state.settings[key]);
    saveState();
  }

  $('#languagePills')?.addEventListener('click', event => {
    const btn = event.target.closest('[data-lang]');
    if(!btn) return;
    state.settings.language = btn.dataset.lang;
    saveState();
    renderSettings();
    toast(`Voice language: ${btn.textContent}`);
  });

  function usePrescriptionText(){
    const text = $('#rxOutput').value.trim();
    if(!text){
      toast('No prescription text to use');
      return;
    }
    $('#prescriptionText').value = text;
    goTo('scan');
    toast('Prescription copied to scan flow');
  }

  function reportText(report){
    if(!report) return 'No report available.';
    const checks = (report.checks || []).map(c => `- ${c.title}: ${c.level.toUpperCase()} — ${c.detail}`).join('\n');
    const recs = (report.recommendations || []).map(r => `- ${r}`).join('\n');
    return `MediCheck AI Safety Report\n\nMedicine: ${report.medicineName}\nResult: ${report.title} (${report.score}/100)\nPatient: ${report.patientName}\nSource: ${report.source}\nTime: ${report.createdAtLabel}\n\nExplanation:\n${report.explanation}\n\nChecks:\n${checks}\n\nRecommendations:\n${recs}\n\nDisclaimer: ${window.MEDICHECK_DB.disclaimers.join(' ')}`;
  }

  function speakCurrentReport(){
    const report = state.currentReport || state.history[0];
    if(!report){
      toast('No report to speak');
      return;
    }
    const lang = state.settings.language;
    let text;
    if(lang === 'hindi'){
      text = `MediCheck AI report. Result: ${report.title}. Score ${report.score} out of 100. ${report.explanation}. Recommendation: ${(report.recommendations || []).join('. ')}`;
    }else if(lang === 'hinglish'){
      text = `MediCheck AI report. Result ${report.title}. Safety score ${report.score} out of 100. ${report.explanation}. Kripya medicine lene se pehle prescription aur pharmacist se confirm karein.`;
    }else{
      text = `MediCheck AI report. Result ${report.title}. Safety score ${report.score} out of 100. ${report.explanation}.`;
    }
    if(!('speechSynthesis' in window)){
      toast('Speech synthesis not supported in this browser');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = .95;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
    toast('Speaking safety report');
  }

  async function shareReport(){
    const text = reportText(state.currentReport);
    if(navigator.share){
      try{
        await navigator.share({title:'MediCheck AI Safety Report', text});
      }catch(error){ /* user cancelled */ }
    }else{
      await navigator.clipboard?.writeText(text);
      toast('Report copied to clipboard');
    }
  }

  function exportCurrentReport(){
    if(!state.currentReport){
      toast('No report to export');
      return;
    }
    downloadFile(`medicheck-report-${state.currentReport.id}.txt`, reportText(state.currentReport), 'text/plain');
  }

  function exportHistory(){
    downloadFile('medicheck-history.json', JSON.stringify(state.history, null, 2), 'application/json');
  }

  function downloadFile(filename, content, type){
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function confirmClearHistory(){
    openModal('Clear history?', 'This deletes saved reports from this browser only.', () => {
      state.history = [];
      state.currentReport = null;
      saveState();
      renderAll();
      goTo('history');
      toast('History cleared');
    });
  }

  function confirmResetApp(){
    openModal('Reset app?', 'This clears mode, profile, settings, and reports from this browser.', () => {
      localStorage.removeItem(storageKey);
      state = structuredClone(defaultState);
      populateFields();
      renderAll();
      goTo('onboarding');
      toast('App reset');
    });
  }

  function openModal(title, text, onConfirm){
    pendingConfirm = onConfirm;
    $('#modalTitle').textContent = title;
    $('#modalText').textContent = text;
    $('#confirmModal').classList.add('active');
  }

  function closeModal(){
    pendingConfirm = null;
    $('#confirmModal').classList.remove('active');
  }

  function runPendingConfirm(){
    if(typeof pendingConfirm === 'function') pendingConfirm();
    closeModal();
  }

  function cryptoRandomId(){
    if(window.crypto?.randomUUID) return crypto.randomUUID().slice(0, 8);
    return Math.random().toString(16).slice(2, 10);
  }

  function toast(message){
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 2300);
  }

  init();
})();
