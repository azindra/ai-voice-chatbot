let recognition;
let isRecording = false;

// Setup Speech Recognition
function setupRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("Please use Chrome browser for speech recognition!");
        return null;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isRecording = true;
        document.getElementById('micBtn').classList.add('recording');
        document.getElementById('status').textContent = '🔴 Listening... Speak now!';
    };

    recognition.onresult = (event) => {
        const userText = event.results[0][0].transcript;
        addMessage(userText, 'user');
        document.getElementById('status').textContent = '⏳ Thinking...';
        sendToBot(userText);
    };

    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        document.getElementById('status').textContent = '❌ Error! Try again.';
        stopRecording();
    };

    recognition.onend = () => {
        stopRecording();
    };

    return recognition;
}

function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    if (!recognition) {
        recognition = setupRecognition();
    }
    if (recognition) {
        recognition.start();
    }
}

function stopRecording() {
    isRecording = false;
    document.getElementById('micBtn').classList.remove('recording');
    document.getElementById('status').textContent = '🎙️ Click mic to start speaking';
    if (recognition) {
        recognition.stop();
    }
}

function addMessage(text, sender) {
    const chatBox = document.getElementById('chatBox');
    const message = document.createElement('div');
    message.classList.add('message');
    message.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    message.innerHTML = `
        <div class="message-label">${sender === 'user' ? '🧑 You' : '🤖 Assistant'}</div>
        <span>${text}</span>
    `;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendToBot(userText) {
    const useRag = document.getElementById('ragToggle').checked;
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                text: userText,
                use_rag: useRag
            })
        });

        const data = await response.json();

        if (data.bot_response) {
            addMessage(data.bot_response, 'bot');
            document.getElementById('status').textContent = '🔊 Speaking...';
            
            const audio = new Audio(data.audio_url);
            audio.play();
            audio.onended = () => {
                document.getElementById('status').textContent = '🎙️ Click mic to start speaking';
            };
        }
    } catch (error) {
        console.error('Error:', error);
        addMessage('Sorry, something went wrong! Please try again.', 'bot');
        document.getElementById('status').textContent = '🎙️ Click mic to start speaking';
    }
}

// PDF Upload
async function uploadPDF() {
    const fileInput = document.getElementById('pdfInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please choose a PDF file first!');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    document.getElementById('uploadStatus').textContent = '⏳ Processing...';
    document.getElementById('processBtn').disabled = true;

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('uploadStatus').textContent = '✅ ' + data.success;
            addMessage('📄 Document uploaded! You can now ask me questions about it.', 'bot');
        } else {
            document.getElementById('uploadStatus').textContent = '❌ ' + data.error;
        }
    } catch (error) {
        document.getElementById('uploadStatus').textContent = '❌ Upload failed!';
    }

    document.getElementById('processBtn').disabled = false;
}

// Show filename when selected
document.addEventListener('DOMContentLoaded', () => {
    setupRecognition();
    
    document.getElementById('pdfInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('uploadStatus').textContent = '📄 ' + file.name;
        }
    });
});