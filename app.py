from flask import Flask, render_template, request, jsonify, send_file
import requests
from gtts import gTTS
import tempfile
import os
from rag import get_rag_response, load_documents, create_vector_store

app = Flask(__name__)

def text_to_speech(text):
    tts = gTTS(text=text, lang='en')
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
    tts.save(temp_file.name)
    return temp_file.name

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_text = data.get('text', '')
    use_rag = data.get('use_rag', True)

    if not user_text:
        return jsonify({'error': 'No text received'}), 400

    # Get response from RAG or Ollama
    bot_response = get_rag_response(user_text, use_rag)

    # Convert to speech
    audio_file = text_to_speech(bot_response)

    return jsonify({
        'user_text': user_text,
        'bot_response': bot_response,
        'audio_url': '/audio?file=' + audio_file
    })

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file and file.filename.endswith('.pdf'):
        # Save PDF to documents folder
        os.makedirs('documents', exist_ok=True)
        file_path = os.path.join('documents', file.filename)
        file.save(file_path)

        # Create vector store from documents
        documents = load_documents('documents')
        create_vector_store(documents)

        return jsonify({'success': f'{file.filename} uploaded and processed!'})

    return jsonify({'error': 'Only PDF files allowed'}), 400

@app.route('/audio')
def audio():
    file_path = request.args.get('file')
    return send_file(file_path, mimetype='audio/mpeg')

if __name__ == '__main__':
    app.run(debug=True)