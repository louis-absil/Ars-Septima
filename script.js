document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM chargé. Initialisation V4.15 (Debug Accord Actif)..."); // Version

    // === Configuration ===
    const CHORD_TYPES = {
        major: { name: "Majeur", intervals: [0, 4, 7], type: 'triad' },
        minor: { name: "Mineur", intervals: [0, 3, 7], type: 'triad' },
        augmented: { name: "Augmenté", intervals: [0, 4, 8], type: 'triad' },
        diminished: { name: "Diminué", intervals: [0, 3, 6], type: 'triad' },
        dominant7: { name: "Dom 7", intervals: [0, 4, 7, 10], type: 'seventh' },
        major7: { name: "Maj7", intervals: [0, 4, 7, 11], type: 'seventh' },
        minor7: { name: "min7", intervals: [0, 3, 7, 10], type: 'seventh' },
        diminished7: { name: "dim7", intervals: [0, 3, 6, 9], type: 'seventh' },
        halfDiminished7: { name: "m7♭5", intervals: [0, 3, 6, 10], type: 'seventh' },
        minorMajor7: { name: "minMaj7", intervals: [0, 3, 7, 11], type: 'seventh' },
    };
    const TRIAD_KEYS = ['major', 'minor', 'augmented', 'diminished'];
    const DIM7_KEY = 'diminished7';
    const INVERSIONS = {
        root:   { name: "7",  fullName: "Fondamentale (7)",  shift: 0 },
        first:  { name: "65", fullName: "1ère Inversion (65)", shift: 1 },
        second: { name: "43", fullName: "2ème Inversion (43)", shift: 2 },
        third:  { name: "2",  fullName: "3ème Inversion (2)",  shift: 3 }
    };
    const TIMBRES = {
        'sawtooth': { name: 'Synthé Dents de Scie', options: { oscillator: { type: 'fatsawtooth' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.4 } } },
        'sine': { name: 'Synthé Sinus', options: { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 } } },
         'triangle': { name: 'Synthé Triangle', options: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 } } },
         'square': { name: 'Synthé Carré', options: { oscillator: { type: 'square' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.3 } } },
        'fm': { name: 'Synthé FM', options: { harmonicity: 1.5, modulationIndex: 5, envelope: {attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.6 } }, voiceType: Tone.FMSynth },
        'am': { name: 'Synthé AM', options: { harmonicity: 1.2, envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.5 } }, voiceType: Tone.AMSynth },
        'duo': { name: 'Synthé Duo', options: { vibratoAmount: 0.1, harmonicity: 1.0, voice0: { volume: -10, oscillator: {type: 'sine'} }, voice1: { volume: -10, oscillator: { type: 'square'} } }, voiceType: Tone.DuoSynth },
        'pluckEmulated': { name: 'Pluck (Émulé)', options: { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.01, release: 0.5 } } },
        'membrane': { name: 'Synthé Membrane', options: { pitchDecay: 0.05, octaves: 5, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential'} }, voiceType: Tone.MembraneSynth },
        'electricPiano': { name: 'Piano Électrique (FM)', voiceType: Tone.FMSynth, options: { harmonicity: 3.01, modulationIndex: 14, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.8 }, modulation: { type: 'square' }, modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.01, release: 0.7 } } }
    };
    const LOCAL_STORAGE_KEY = 'chordTrainerData_v2';
    const TIMED_MODE_DURATION = 30;

    // === Raccourcis Clavier ===
    const PLAY_NEW_SHORTCUT = 'e'; const REPLAY_SHORTCUT = 'r'; const HINT_SHORTCUT = 'i'; const STOP_CHRONO_SHORTCUT = 'escape';
    const TYPE_SHORTCUT_KEYS = ['s', 'd', 'f', 'g', 'h', 'j'];
    const INVERSION_SHORTCUT_MAP = { 'x': 'root', 'c': 'first', 'v': 'second', 'b': 'third' };

    // === Structure Données Persistantes ===
    let appData = { stats: {}, globalScore: 0, timedModeHighScore: 0 };

    // --- État Application (non persisté) ---
    let currentChord = null; let synth = null; let currentTimbreKey = 'sawtooth';
    let gameActive = false; let selectedTypeAnswer = null; let selectedInversionAnswer = null;
    let currentStreak = 0; let hintUsedThisTurn = false;
    let isTimedModeActive = false; let timedGameRunning = false;
    let timerValue = TIMED_MODE_DURATION; let timerInterval = null; let timedModeScore = 0;
    let scoreAnimationInterval = null;

    // --- Éléments DOM ---
    const playChordBtn = document.getElementById('playChordBtn'); const replayBtn = document.getElementById('replayBtn'); const hintBtn = document.getElementById('hintBtn'); const stopChronoBtn = document.getElementById('stopChronoBtn'); const feedbackDiv = document.getElementById('feedback'); const typeAnswerButtonsDiv = document.getElementById('typeAnswerButtons'); const inversionAnswerButtonsDiv = document.getElementById('inversionAnswerButtons'); const inversionSection = document.getElementById('inversionSection'); const settingsPanel = document.querySelector('.settings-panel'); const specificChordTogglesDiv = document.getElementById('specificChordToggles'); const enableInversionsCheckbox = document.getElementById('enableInversions'); const timedModeCheckbox = document.getElementById('timedModeCheckbox'); const timbreSelect = document.getElementById('timbreSelect'); const statsList = document.getElementById('statsList'); const resetStatsBtn = document.getElementById('resetStatsBtn'); const globalScoreDisplay = document.getElementById('globalScoreDisplay'); const streakDisplay = document.getElementById('streakDisplay'); const timerDisplay = document.getElementById('timerDisplay'); const highScoreDisplay = document.getElementById('highScoreDisplay'); const globalSuccessRateSpan = document.getElementById('globalSuccessRate');

    // Vérification DOM Initiale
    const requiredElements = { playChordBtn, replayBtn, hintBtn, stopChronoBtn, feedbackDiv, typeAnswerButtonsDiv, inversionAnswerButtonsDiv, inversionSection, settingsPanel, specificChordTogglesDiv, enableInversionsCheckbox, timedModeCheckbox, timbreSelect, statsList, resetStatsBtn, globalScoreDisplay, streakDisplay, timerDisplay, highScoreDisplay, globalSuccessRateSpan };
    let missingElement = false;
    for(const [key, element] of Object.entries(requiredElements)) {
        if (!element) { console.error(`ERREUR CRITIQUE: Élément DOM #${key} non trouvé.`); missingElement = true; }
    }
    if (missingElement) { alert("Erreur critique : Interface incomplète. Vérifiez la console (F12)."); return; }
    else { console.log("Vérification initiale des éléments DOM: OK"); }

    // --- Initialisation ---
    function initialize() {
        console.log("initialize() V4.15");
        loadData();
        setupTimbreOptions();
        setupSettingsCheckboxes();
        changeTimbre(currentTimbreKey);
        isTimedModeActive = timedModeCheckbox.checked;
        updateAvailableChordsUI();
        bindEvents();
        updateButtonStates();
        resetAnswerSelection();
        updateGameInfoDisplays();
        displayStats();
        feedbackDiv.innerHTML = 'Cliquez sur "Nouvel Accord" pour commencer.';
    }

    // === Gestion Stats & Scores ===
    function initializeAppData() { appData = { stats: {}, globalScore: 0, timedModeHighScore: 0 }; Object.keys(CHORD_TYPES).forEach(key => { if (!TRIAD_KEYS.includes(key)) { appData.stats[key] = { correct: 0, total: 0 }; } }); console.log("Nouvel objet appData créé."); }
    function loadData() { try { const savedData = localStorage.getItem(LOCAL_STORAGE_KEY); if (savedData) { const parsedData = JSON.parse(savedData); if (parsedData && typeof parsedData.stats === 'object' && typeof parsedData.globalScore === 'number' && typeof parsedData.timedModeHighScore === 'number') { let statsValid = true; const expectedSeventhKeys = Object.keys(CHORD_TYPES).filter(k => !TRIAD_KEYS.includes(k)); expectedSeventhKeys.forEach(key => { if (!parsedData.stats[key] || typeof parsedData.stats[key].correct !== 'number' || typeof parsedData.stats[key].total !== 'number') { statsValid = false; } }); if(!statsValid){ console.warn("Structure stats invalide, reset."); initializeAppData(); saveData();} else { appData = parsedData; console.log("Données chargées:", appData); } } else { console.warn("Données localStorage invalides, reset."); initializeAppData(); saveData(); } } else { initializeAppData(); } } catch (e) { console.error("Erreur chargement données:", e); initializeAppData(); } }
    function saveData() { try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData)); } catch (e) { console.error("Erreur sauvegarde données:", e); feedbackDiv.innerHTML = '<span style="color: orange;">Erreur sauvegarde.</span>'; } }
    function handleResetStats() { if (confirm('Effacer toutes vos statistiques ET scores ?\n(Irréversible)')) { console.log("Reset données confirmé."); initializeAppData(); currentStreak = 0; saveData(); displayStats(); updateGameInfoDisplays(); feedbackDiv.innerHTML = "Statistiques et scores réinitialisés."; feedbackDiv.className = 'feedback-message info'; } else { console.log("Reset annulé."); } }

    // === Affichage Stats & Taux Global ===
    function calculateAndDisplayGlobalRate() { let totalCorrect = 0; let totalPlayed = 0; Object.values(appData.stats).forEach(stat => { if (stat) { totalCorrect += stat.correct; totalPlayed += stat.total; } }); let rateText = "(Total: --%)"; if (totalPlayed > 0) { const percentage = ((totalCorrect / totalPlayed) * 100).toFixed(1); rateText = `(Total: ${percentage}%)`; } if (globalSuccessRateSpan) { globalSuccessRateSpan.textContent = rateText; } }
    function displayStats() { if (!statsList) return; statsList.innerHTML = ''; const activeChordKeys = getAllowedChordKeys(); let statsDisplayedCount = 0; Object.keys(appData.stats).forEach(key => { if (appData.stats[key]?.total > 0 || activeChordKeys.includes(key)) { statsDisplayedCount++; const stats = appData.stats[key]; const chordName = CHORD_TYPES[key]?.name || key; const li = document.createElement('li'); const nameSpan = document.createElement('span'); nameSpan.className = 'stat-chord-name'; nameSpan.textContent = chordName; li.appendChild(nameSpan); if (stats.total > 0) { const percentage = ((stats.correct / stats.total) * 100).toFixed(1); const scoreSpan = document.createElement('span'); scoreSpan.className = 'stat-score'; scoreSpan.textContent = `${stats.correct} / ${stats.total}`; li.appendChild(scoreSpan); const percentSpan = document.createElement('span'); percentSpan.className = 'stat-percent'; percentSpan.textContent = `(${percentage}%)`; li.appendChild(percentSpan); } else { const noDataSpan = document.createElement('span'); noDataSpan.className = 'no-data'; noDataSpan.textContent = '(Pas joué)'; li.appendChild(noDataSpan); } statsList.appendChild(li); } }); if (statsDisplayedCount === 0) { statsList.innerHTML = '<li>Aucune stat. Activez des accords.</li>'; } calculateAndDisplayGlobalRate(); }

    // === Animation du Score ===
    function animateScoreUpdate(element, startValue, endValue, duration) { if (!element) return; if (startValue === endValue) { element.textContent = `Score: ${endValue}`; return; } clearInterval(scoreAnimationInterval); let current = startValue; const difference = endValue - startValue; const stepTime = 20; const totalSteps = Math.max(1, Math.round(duration / stepTime)); const increment = difference / totalSteps; scoreAnimationInterval = setInterval(() => { current += increment; if ((increment > 0 && current >= endValue) || (increment < 0 && current <= endValue)) { current = endValue; clearInterval(scoreAnimationInterval); } element.textContent = `Score: ${Math.round(current)}`; }, stepTime); }
    function updateGameInfoDisplays() { streakDisplay.textContent = `Série: ${currentStreak}`; timerDisplay.textContent = timedGameRunning ? `Temps: ${timerValue}s` : 'Temps: --'; highScoreDisplay.textContent = `Meilleur Chrono: ${appData.timedModeHighScore}`; }

    // --- Setup UI / Change Timbre / Filtrage / Génération / Lecture ---
    function setupTimbreOptions() { timbreSelect.innerHTML = ''; Object.keys(TIMBRES).forEach(key => { const option = document.createElement('option'); option.value = key; option.textContent = TIMBRES[key].name; timbreSelect.appendChild(option); }); timbreSelect.value = currentTimbreKey; }
    function setupSettingsCheckboxes() { // Logs détaillés
        specificChordTogglesDiv.innerHTML = ''; let seventhChordCount = 0; console.log("--- setupSettingsCheckboxes ---");
        Object.keys(CHORD_TYPES).forEach(key => { const chord = CHORD_TYPES[key]; const div = document.createElement('div'); const input = document.createElement('input'); input.type = 'checkbox'; input.id = `toggle_${key}`; input.name = 'specificChord'; input.value = key; const isTriad = TRIAD_KEYS.includes(key); input.checked = !isTriad; input.dataset.chordType = chord.type; const label = document.createElement('label'); label.htmlFor = `toggle_${key}`; label.textContent = chord.name; if (isTriad) { div.style.display = 'none'; } else { seventhChordCount++; console.log(`Checkbox ${key}: Seventh, Visible, Initial Checked State = ${input.checked}`); } div.appendChild(input); div.appendChild(label); if (specificChordTogglesDiv) { specificChordTogglesDiv.appendChild(div); } else { console.error("ERREUR: specificChordTogglesDiv non trouvé lors de l'ajout de", key); } });
        console.log(`${seventhChordCount} checkboxes 7ème ajoutées au DOM.`);
    }
    function changeTimbre(timbreKey) { console.log(`changeTimbre(${timbreKey})`); if (!TIMBRES[timbreKey]) return; currentTimbreKey = timbreKey; if (synth) synth.dispose(); synth = null; try { const timbreInfo = TIMBRES[timbreKey]; const VoiceType = timbreInfo.voiceType || Tone.Synth; synth = new Tone.PolySynth(VoiceType, timbreInfo.options).toDestination(); console.log("Synth créé:", synth); } catch (error) { console.error("Erreur création synth:", error); feedbackDiv.innerHTML = '<span style="color: red;">Erreur son.</span>'; synth = null; } }
    function getAllowedChordKeys() { // Logs détaillés
         if (!specificChordTogglesDiv) { console.error("ERREUR: specificChordTogglesDiv non trouvé dans getAllowedChordKeys!"); return []; }
         const checkedCheckboxes = specificChordTogglesDiv.querySelectorAll('input[type="checkbox"]:checked'); let allowedKeys = []; console.log(`getAllowedChordKeys: Found ${checkedCheckboxes.length} checked boxes.`);
         checkedCheckboxes.forEach(checkbox => { allowedKeys.push(checkbox.value); console.log(`   - Including checked: ${checkbox.value}`); });
         console.log(`getAllowedChordKeys final result => [${allowedKeys.join(', ')}]`);
         return allowedKeys;
     }
    function generateRandomChord() { const allowedKeys = getAllowedChordKeys(); if (!allowedKeys || allowedKeys.length === 0) { console.error("generateRandomChord: Aucun accord autorisé!"); return null; } const randomTypeKey = allowedKeys[Math.floor(Math.random() * allowedKeys.length)]; const chordInfo = CHORD_TYPES[randomTypeKey]; const rootMidiNote = 48 + Math.floor(Math.random() * 24); let midiNotes = chordInfo.intervals.map(interval => rootMidiNote + interval); let inversionKey = 'root'; const useInversionsGlobally = enableInversionsCheckbox.checked; if (useInversionsGlobally && randomTypeKey !== DIM7_KEY && chordInfo.intervals.length > 1) { const possibleInversions = ['root', 'first']; if (chordInfo.intervals.length >= 3) possibleInversions.push('second'); if (chordInfo.intervals.length === 4) possibleInversions.push('third'); const validInversions = possibleInversions.filter((inv, index) => index < chordInfo.intervals.length); if (validInversions.length > 0) { inversionKey = validInversions[Math.floor(Math.random() * validInversions.length)]; if (inversionKey !== 'root') { const shift = INVERSIONS[inversionKey].shift; if(shift < midiNotes.length) { for (let i = 0; i < shift; i++) midiNotes[i] += 12; midiNotes.sort((a, b) => a - b); } else { inversionKey = 'root'; } } } else { inversionKey = 'root'; } } else if (randomTypeKey === DIM7_KEY) { inversionKey = 'root'; } const notesForTone = midiNotes.map(midi => Tone.Frequency(midi, "midi").toNote()); currentChord = { midiNotes: notesForTone, type: randomTypeKey, typeName: chordInfo.name, inversion: inversionKey, inversionName: INVERSIONS[inversionKey].fullName }; console.log("Accord généré:", currentChord.typeName, currentChord.inversionName); return currentChord; }
    function playChord() { console.log("playChord()"); if (!synth || !currentChord) return; try { synth.releaseAll(Tone.now() - 0.01); synth.triggerAttackRelease(currentChord.midiNotes, "1.5s", Tone.now()); } catch (error) { console.error("Erreur Tone.js:", error); feedbackDiv.innerHTML = '<span style="color: red;">Erreur lecture.</span>'; } }

    // --- Clics / Vérification Réponse / Reset ---
    function handleTypeAnswerClick(eventOrButton) { if (!gameActive) return; const clickedButton = eventOrButton.target ? eventOrButton.target : eventOrButton; selectedTypeAnswer = clickedButton.dataset.chordTypeKey; typeAnswerButtonsDiv.querySelectorAll('button').forEach(btn => btn.classList.remove('selected')); clickedButton.classList.add('selected'); const needsInversion = enableInversionsCheckbox.checked && currentChord?.type !== DIM7_KEY; if (!needsInversion) { selectedInversionAnswer = 'root'; checkAnswer(); } else { feedbackDiv.innerHTML = "Sélectionnez le renversement."; feedbackDiv.className = 'feedback-message info'; } }
    function handleInversionAnswerClick(eventOrButton) { if (!gameActive || !enableInversionsCheckbox.checked || !selectedTypeAnswer || currentChord?.type === DIM7_KEY) return; const clickedButton = eventOrButton.target ? eventOrButton.target : eventOrButton; selectedInversionAnswer = clickedButton.dataset.inversionKey; inversionAnswerButtonsDiv.querySelectorAll('button').forEach(btn => btn.classList.remove('selected')); clickedButton.classList.add('selected'); checkAnswer(); }
    function checkAnswer() { /* ... Identique V4.13 (avec animation streak) ... */ if (!currentChord || !selectedTypeAnswer) { return; } if (enableInversionsCheckbox.checked && currentChord.type !== DIM7_KEY && !selectedInversionAnswer) { return; } const correctType = selectedTypeAnswer === currentChord.type; let correctInversion = true; if (enableInversionsCheckbox.checked && currentChord.type !== DIM7_KEY) { correctInversion = (selectedInversionAnswer === currentChord.inversion); } else if (currentChord.type === DIM7_KEY) { correctInversion = (selectedInversionAnswer === 'root'); } let correct = correctType && correctInversion; const chordTypeKey = currentChord.type; const oldGlobalScore = appData.globalScore; if (appData.stats[chordTypeKey]) { appData.stats[chordTypeKey].total++; if (correct) { appData.stats[chordTypeKey].correct++; } } let message = ""; const correctTypeName = CHORD_TYPES[currentChord.type].name; const correctInversionFullName = INVERSIONS[currentChord.inversion].fullName; const basePoints = 10; const streakBonus = 5; const hintPenaltyFactor = 0.2; if (correct) { message = `<span style="font-weight: bold; color: #0f5132;">Correct !</span> C'était ${correctTypeName} (${correctInversionFullName})`; feedbackDiv.className = 'feedback-message correct'; if (!timedGameRunning) { let pointsEarned = basePoints + (currentStreak * streakBonus); let streakIncreased = false; if (hintUsedThisTurn) { pointsEarned = Math.floor(basePoints * hintPenaltyFactor); message += ` (Indice utilisé, +${pointsEarned} pts)`; } else { currentStreak++; streakIncreased = true; message += ` (+${pointsEarned} pts, Série: ${currentStreak})`; } appData.globalScore += pointsEarned; if (streakIncreased && streakDisplay) { let streakClass = 'streak-pop-low'; if (currentStreak >= 10) streakClass = 'streak-pop-high'; else if (currentStreak >= 5) streakClass = 'streak-pop-mid'; streakDisplay.classList.remove('streak-pop-low', 'streak-pop-mid', 'streak-pop-high'); void streakDisplay.offsetWidth; streakDisplay.classList.add(streakClass); streakDisplay.addEventListener('animationend', () => { if(streakDisplay) streakDisplay.classList.remove('streak-pop-low', 'streak-pop-mid', 'streak-pop-high'); }, { once: true }); } animateScoreUpdate(globalScoreDisplay, oldGlobalScore, appData.globalScore, 500); updateGameInfoDisplays(); } else { timedModeScore++; updateGameInfoDisplays(); } } else { message = `<span style="font-weight: bold; color: #842029;">Incorrect.</span>`; const guessedTypeName = CHORD_TYPES[selectedTypeAnswer]?.name || "Inconnu"; const showGuessedInversion = enableInversionsCheckbox.checked && currentChord.type !== DIM7_KEY && selectedInversionAnswer; const guessedInversionFullName = showGuessedInversion ? (INVERSIONS[selectedInversionAnswer]?.fullName || "") : ""; if (!timedGameRunning) { message += ` Vous avez choisi ${guessedTypeName}`; if (showGuessedInversion) { message += ` (${guessedInversionFullName})`; } } message += `. C'était ${correctTypeName} (${correctInversionFullName})`; feedbackDiv.className = 'feedback-message incorrect'; if (!timedGameRunning) { if (currentStreak > 0) { message += ` (Série brisée)`; } currentStreak = 0; updateGameInfoDisplays(); } else { updateGameInfoDisplays(); } globalScoreDisplay.textContent = `Score: ${appData.globalScore}`; } feedbackDiv.innerHTML = message; gameActive = false; saveData(); displayStats(); updateButtonStates(); if (timedGameRunning) { const delay = correct ? 350 : 700; setTimeout(generateAndPlayNewChord, delay); } }
    function resetAnswerSelection() { /* ... Identique V4.13 ... */ selectedTypeAnswer = null; selectedInversionAnswer = null; typeAnswerButtonsDiv.querySelectorAll('button.selected').forEach(btn => btn.classList.remove('selected')); inversionAnswerButtonsDiv.querySelectorAll('button.selected').forEach(btn => btn.classList.remove('selected')); hintUsedThisTurn = false; }

    // --- Mise à jour UI Réponses (Avec raccourcis) ---
    function updateAvailableChordsUI() { // Logs détaillés
        console.log("--- updateAvailableChordsUI ---");
        typeAnswerButtonsDiv.innerHTML = ''; inversionAnswerButtonsDiv.innerHTML = '';
        const allowedKeys = getAllowedChordKeys(); // Log est déjà dans cette fonction
        const useInversions = enableInversionsCheckbox.checked;
        inversionSection.style.display = useInversions ? 'block' : 'none';

        if (!allowedKeys || allowedKeys.length === 0) {
            typeAnswerButtonsDiv.innerHTML = '<p style="font-style: italic; font-size: 0.9rem; text-align: center; color: #6c757d;">Aucun accord de 7ème actif.</p>';
            inversionSection.style.display = 'none';
            console.log("Aucun accord actif trouvé par updateAvailableChordsUI.");
        } else {
            console.log(`Création de ${allowedKeys.length} boutons de type.`);
            allowedKeys.forEach((typeKey, index) => {
                if (!CHORD_TYPES[typeKey]) { console.warn(`Clé d'accord inconnue: ${typeKey}`); return; }
                // console.log(`>>> Creating TYPE button for ${typeKey}`);
                const shortcut = (index < TYPE_SHORTCUT_KEYS.length) ? TYPE_SHORTCUT_KEYS[index] : null;
                const button = document.createElement('button');
                button.innerHTML = `${CHORD_TYPES[typeKey].name} ${shortcut ? `<kbd class="shortcut-key">${shortcut.toUpperCase()}</kbd>` : ''}`;
                button.dataset.chordTypeKey = typeKey;
                if(shortcut) button.dataset.shortcut = shortcut;
                button.addEventListener('click', handleTypeAnswerClick);
                typeAnswerButtonsDiv.appendChild(button);
            });
            if (useInversions) {
                console.log("Création des boutons d'inversion.");
                Object.entries(INVERSIONS).forEach(([invKey, invData]) => {
                    const button = document.createElement('button');
                    const shortcut = Object.keys(INVERSION_SHORTCUT_MAP).find(key => INVERSION_SHORTCUT_MAP[key] === invKey);
                    let buttonText = invData.name; if (shortcut) { buttonText += ` <kbd class="shortcut-key">${shortcut.toUpperCase()}</kbd>`; } button.innerHTML = buttonText; button.dataset.inversionKey = invKey; if(shortcut) button.dataset.shortcut = shortcut; button.addEventListener('click', handleInversionAnswerClick); inversionAnswerButtonsDiv.appendChild(button);
                });
            }
        }
        updateButtonStates(); displayStats();
        console.log("--- Fin updateAvailableChordsUI ---");
    }

    // --- États / Utilitaires ---
    function generateAndPlayNewChord() { // Log debug ajouté
         if (isTimedModeActive && !timedGameRunning) { startTimedGame(); return; }
         console.log("generateAndPlayNewChord() called...");
         // LOG AJOUTÉ : Vérifier les cases cochées JUSTE AVANT d'appeler generateRandomChord
         const currentChecked = document.querySelectorAll('#specificChordToggles input[type="checkbox"]:checked');
         console.log(`   >> Checkboxes checked just before generating: ${currentChecked.length}`);
         currentChecked.forEach(cb => console.log(`      - ${cb.value} (ID: ${cb.id})`));
         // --- Fin log ajouté ---
         feedbackDiv.innerHTML = ""; feedbackDiv.className = 'feedback-message'; resetAnswerSelection();
         currentChord = generateRandomChord(); // Appelle getAllowedChordKeys à l'intérieur
         if (currentChord) { gameActive = true; updateButtonStates(); playChord(); }
         else { if (timedGameRunning) { endTimedGame("Erreur génération accord."); } else { gameActive = false; feedbackDiv.innerHTML = '<span style="color: red;">Erreur génération accord (aucun type actif?).</span>'; feedbackDiv.className = 'feedback-message incorrect'; updateButtonStates(); } }
     }
    function updateButtonStates() { /* ... Identique V4.13 ... */ const inversionsOn = enableInversionsCheckbox.checked; const typeButtonsAvailable = typeAnswerButtonsDiv.querySelector('button') !== null; playChordBtn.style.display = timedGameRunning ? 'none' : 'inline-flex'; stopChronoBtn.style.display = timedGameRunning ? 'inline-flex' : 'none'; playChordBtn.disabled = gameActive || timedGameRunning || !typeButtonsAvailable; replayBtn.disabled = !currentChord; hintBtn.disabled = !gameActive || hintUsedThisTurn ; const disableAnswerButtons = !gameActive || !typeButtonsAvailable; typeAnswerButtonsDiv.querySelectorAll('button').forEach(btn => btn.disabled = disableAnswerButtons); const disableInversionButtonsSpecific = disableAnswerButtons || !inversionsOn || (currentChord?.type === DIM7_KEY) ; inversionAnswerButtonsDiv.querySelectorAll('button').forEach(btn => btn.disabled = disableInversionButtonsSpecific); inversionSection.style.display = typeButtonsAvailable && inversionsOn ? 'block' : 'none'; /*console.log(`States Updated`);*/ }
    function resetGameOnSettingsChange() { /* ... Identique V4.13 ... */ console.log("Réinitialisation jeu."); if (timedGameRunning) { endTimedGame("Mode arrêté (paramètres modifiés)."); } feedbackDiv.innerHTML = "Paramètres mis à jour."; feedbackDiv.className = 'feedback-message info'; currentChord = null; gameActive = false; resetAnswerSelection(); updateButtonStates(); }

    // --- Logique Mode Chrono ---
    function startTimedGame() { /* ... Identique V4.13 ... */ console.log("Starting Timed Game!"); isTimedModeActive = true; timedGameRunning = true; timedModeScore = 0; timerValue = TIMED_MODE_DURATION; currentStreak = 0; feedbackDiv.innerHTML = "Mode Chrono Démarré !"; feedbackDiv.className = 'feedback-message info'; updateGameInfoDisplays(); timedModeCheckbox.disabled = true; if(timerInterval) clearInterval(timerInterval); timerInterval = setInterval(updateTimer, 1000); generateAndPlayNewChord(); }
    function updateTimer() { /* ... Identique V4.13 ... */ timerValue--; updateGameInfoDisplays(); if (timerValue <= 0) { endTimedGame("Temps écoulé !"); } }
    function endTimedGame(endMessage = "Fin du mode chrono.") { /* ... Identique V4.13 ... */ console.log("Ending Timed Game!"); clearInterval(timerInterval); timerInterval = null; timedGameRunning = false; gameActive = false; if (timedModeScore > appData.timedModeHighScore) { appData.timedModeHighScore = timedModeScore; endMessage += ` Nouveau meilleur score : ${appData.timedModeHighScore} !`; saveData(); } else { endMessage += ` Score: ${timedModeScore}. (Meilleur: ${appData.timedModeHighScore})`; } feedbackDiv.innerHTML = endMessage; feedbackDiv.className = 'feedback-message info'; timedModeCheckbox.disabled = false; timerValue = TIMED_MODE_DURATION; updateGameInfoDisplays(); updateButtonStates(); }
    function handleStopChronoClick() { /* ... Identique V4.13 ... */ console.log("Stop Chrono button clicked"); if (timedGameRunning) { endTimedGame("Mode Chrono arrêté manuellement."); } }

    // --- Gestionnaire Clic Indice ---
    function handleHintClick() { /* ... Identique V4.13 ... */ if (!gameActive || hintUsedThisTurn || !currentChord || !synth) return; console.log("Hint requested!"); hintUsedThisTurn = true; if (!timedGameRunning) { currentStreak = 0; } hintBtn.disabled = true; updateGameInfoDisplays(); try { const now = Tone.now(); const duration = "8n"; const delay = 0.18; synth.releaseAll(now - 0.01); currentChord.midiNotes.forEach((note, index) => { synth.triggerAttackRelease(note, duration, now + index * delay); }); if (!timedGameRunning) {feedbackDiv.innerHTML = "Indice (Arpège) joué. Série remise à 0."; feedbackDiv.className = 'feedback-message info';} else { feedbackDiv.innerHTML = "Indice (Arpège) joué."; feedbackDiv.className = 'feedback-message info';} } catch(error) { console.error("Erreur arpège:", error); feedbackDiv.innerHTML = '<span style="color: orange;">Erreur indice.</span>'; feedbackDiv.className = 'feedback-message incorrect'; } }

    // --- Gestionnaire Raccourcis Clavier ---
    function handleKeyPress(event) { /* ... Identique V4.13 ... */ if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA' || event.metaKey || event.ctrlKey || event.altKey) { return; } const key = event.key.toLowerCase(); if (key === PLAY_NEW_SHORTCUT && !playChordBtn.disabled) { event.preventDefault(); generateAndPlayNewChord(); return; } if (key === REPLAY_SHORTCUT && !replayBtn.disabled) { event.preventDefault(); playChord(); return; } if (key === HINT_SHORTCUT && !hintBtn.disabled) { event.preventDefault(); handleHintClick(); return; } if (key === STOP_CHRONO_SHORTCUT && timedGameRunning) { event.preventDefault(); handleStopChronoClick(); return; } if (!gameActive) return; const inversionsActiveForCurrentChord = enableInversionsCheckbox.checked && currentChord?.type !== DIM7_KEY; if (TYPE_SHORTCUT_KEYS.includes(key)) { event.preventDefault(); const targetButton = typeAnswerButtonsDiv.querySelector(`button[data-shortcut="${key}"]:not(:disabled)`); if (targetButton) handleTypeAnswerClick(targetButton); return; } if (inversionsActiveForCurrentChord && selectedTypeAnswer && INVERSION_SHORTCUT_MAP[key]) { event.preventDefault(); const targetInversionKey = INVERSION_SHORTCUT_MAP[key]; const targetButton = inversionAnswerButtonsDiv.querySelector(`button[data-inversion-key="${targetInversionKey}"]:not(:disabled)`); if (targetButton) handleInversionAnswerClick(targetButton); return; } }

    // --- Écouteurs d'Événements ---
    function bindEvents() { /* ... Identique V4.13 ... */ console.log("bindEvents() V4.15"); playChordBtn.addEventListener('click', generateAndPlayNewChord); replayBtn.addEventListener('click', playChord); hintBtn.addEventListener('click', handleHintClick); resetStatsBtn.addEventListener('click', handleResetStats); stopChronoBtn.addEventListener('click', handleStopChronoClick); settingsPanel.addEventListener('change', (event) => { const target = event.target; console.log(`Settings change on: ${target.id || target.name}`); if (target === timbreSelect) { changeTimbre(target.value); } else if (target === timedModeCheckbox) { isTimedModeActive = target.checked; console.log("Timed mode toggled:", isTimedModeActive); resetGameOnSettingsChange(); feedbackDiv.innerHTML = `Mode ${isTimedModeActive ? 'Chrono activé' : 'Normal activé'}. Jouez un nouvel accord.`; feedbackDiv.className = 'feedback-message info'; updateGameInfoDisplays(); } else if (target.name === 'specificChord' || target.id === 'enableInversions') { updateAvailableChordsUI(); resetGameOnSettingsChange(); } }); document.addEventListener('keydown', handleKeyPress); console.log("Listeners ajoutés."); }

    // --- Démarrage ---
    let audioContextStarted = false;
    async function startAudioContext() { /* ... Identique V4.13 ... */ if (audioContextStarted || (Tone.context && Tone.context.state === 'running')) return true; try { await Tone.start(); console.log('AudioContext démarré.'); audioContextStarted = true; return true; } catch (e) { console.error("Erreur Tone.start():", e); feedbackDiv.innerHTML = '<span style="color: red;">Init audio échouée.</span>'; return false; } }
    document.body.addEventListener('click', startAudioContext, { once: true });
    playChordBtn.addEventListener('click', startAudioContext);

    initialize(); // Démarrer

}); // Fin DOMContentLoaded