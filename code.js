document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const textToSpeakInput = document.getElementById('text-to-speak');
    const voiceSelect = document.getElementById('voice-select');
    const speakButton = document.getElementById('speak-button');
    const stopButton = document.getElementById('stop-button');
    const statusMessage = document.getElementById('status-message');
    const currentYearSpan = document.getElementById('current-year');

    // Speech Synthesis API
    const synth = window.speechSynthesis;
    let voices = [];

    /**
     * Populates the voice select dropdown with available voices,
     * prioritizing Telugu voices.
     */
    function populateVoiceList() {
        voices = synth.getVoices();
        voiceSelect.innerHTML = ''; // Clear existing options

        const teluguVoices = voices.filter(voice => voice.lang.startsWith('te'));
        const otherVoices = voices.filter(voice => !voice.lang.startsWith('te'));

        // Add a default "auto" option
        const autoOption = document.createElement('option');
        autoOption.textContent = 'ఆటోమేటిక్ (భాష ఆధారిత)';
        autoOption.value = 'auto';
        voiceSelect.appendChild(autoOption);

        // Add Telugu voices first
        teluguVoices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            option.value = voice.name; // Use voice name as value for direct selection
            voiceSelect.appendChild(option);
        });

        // Add a separator if both Telugu and other voices exist
        if (teluguVoices.length > 0 && otherVoices.length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '──────────';
            voiceSelect.appendChild(separator);
        }
        
        // Add other voices
        otherVoices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            option.value = voice.name;
            voiceSelect.appendChild(option);
        });
        
        if (voices.length === 0) {
            showStatus("వాయిస్‌లు లోడ్ కాలేదు లేదా అందుబాటులో లేవు.", "error");
            voiceSelect.disabled = true;
        } else {
             voiceSelect.disabled = false;
        }
    }

    /**
     * Handles the speech synthesis process.
     */
    function speak() {
        if (synth.speaking) {
            // Optionally, one could make this button a pause/resume button
            // Or, simply prevent new speech until current one finishes
            console.warn('SpeechSynthesis is already speaking.');
            // synth.cancel(); // Could be an option to interrupt current speech
            return;
        }

        const text = textToSpeakInput.value.trim();
        if (text === '') {
            showStatus("దయచేసి మాట్లాడటానికి కొంత వచనాన్ని నమోదు చేయండి.", "error");
            textToSpeakInput.focus();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        // Handle voice selection
        const selectedVoiceName = voiceSelect.value;
        if (selectedVoiceName && selectedVoiceName !== 'auto') {
            const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                // utterance.lang will be set by the voice object
            }
        } else {
            // If 'auto' or no specific voice is selected, set lang for better auto-selection
            utterance.lang = 'te-IN'; // Default to Indian Telugu
        }
        
        utterance.onstart = () => {
            showStatus("మాట్లాడటం ప్రారంభించబడింది...", "info");
            speakButton.disabled = true;
            stopButton.style.display = 'inline-flex';
        };

        utterance.onend = () => {
            showStatus("మాట్లాడటం పూర్తయింది.", "success");
            speakButton.disabled = false;
            stopButton.style.display = 'none';
        };

        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            let errorMsg = `ఒక లోపం సంభవించింది: ${event.error}`;
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMsg = "స్పీచ్ సింథసిస్ అనుమతించబడలేదు. దయచేసి మీ బ్రౌజర్ అనుమతులను తనిఖీ చేయండి.";
            } else if (event.error === 'language-unavailable'){
                 errorMsg = "ఎంచుకున్న భాష అందుబాటులో లేదు.";
            } else if (event.error === 'voice-unavailable'){
                 errorMsg = "ఎంచుకున్న వాయిస్ అందుబాటులో లేదు.";
            } else if (event.error === 'synthesis-failed'){
                 errorMsg = "సింథసిస్ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి లేదా వేరే వాయిస్‌ని ఎంచుకోండి.";
            }
            showStatus(errorMsg, "error");
            speakButton.disabled = false;
            stopButton.style.display = 'none';
        };
        
        // Clear any previous status before speaking
        clearStatus();
        synth.speak(utterance);
    }

    /**
     * Stops the current speech synthesis.
     */
    function stopSpeech() {
        if (synth.speaking) {
            synth.cancel(); // This will trigger the 'onend' event for the current utterance.
            // onend will then reset button states.
            // showStatus("మాట్లాడటం ఆపివేయబడింది.", "info"); // Optional: onend handles final status
        }
    }

    /**
     * Displays a status message to the user.
     * @param {string} message - The message to display.
     * @param {'info'|'success'|'error'} type - The type of message.
     */
    let statusTimeout;
    function showStatus(message, type = 'info') {
        clearTimeout(statusTimeout); // Clear any existing timeout
        statusMessage.textContent = message;
        statusMessage.className = type; // This will set 'success', 'error', or 'info'

        // Automatically clear the message after some time, unless it's an error
        // that might need user attention for longer.
        if (type !== 'error') {
            statusTimeout = setTimeout(() => {
                clearStatus();
            }, 5000); // Clear after 5 seconds
        }
    }

    /**
     * Clears the status message.
     */
    function clearStatus() {
        statusMessage.textContent = '';
        statusMessage.className = '';
    }


    /**
     * Initializes the application.
     */
    function initialize() {
        // Set current year in footer
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }

        // Check for Speech Synthesis API support
        if (!synth) {
            showStatus("క్షమించండి, మీ బ్రౌజర్ స్పీచ్ సింథసిస్‌కు మద్దతు ఇవ్వదు.", "error");
            speakButton.disabled = true;
            voiceSelect.disabled = true;
            return;
        }

        // Populate voices when they are loaded
        // Note: getVoices() might return an empty list initially on some browsers.
        // 'voiceschanged' event is crucial.
        populateVoiceList();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = populateVoiceList;
        }

        // Event Listeners
        speakButton.addEventListener('click', speak);
        stopButton.addEventListener('click', stopSpeech);

        // Clear status when user types
        textToSpeakInput.addEventListener('input', () => {
            if (statusMessage.textContent && !synth.speaking) { // Don't clear if actively speaking
                clearStatus();
            }
        });
        
        showStatus("అప్లికేషన్ సిద్ధంగా ఉంది.", "info");
    }

    // Start the application
    initialize();
});