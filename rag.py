import requests
import os
import pypdf

OLLAMA_URL = "http://localhost:11434/api/generate"
CONTEXT_FILE = "vectorstore/context.txt"

def extract_pdf_text(pdf_path):
    text = ""
    with open(pdf_path, 'rb') as f:
        reader = pypdf.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text

def load_documents(docs_folder="documents"):
    documents = []
    if os.path.exists(docs_folder):
        for file in os.listdir(docs_folder):
            if file.endswith(".pdf"):
                pdf_path = os.path.join(docs_folder, file)
                text = extract_pdf_text(pdf_path)
                documents.append(text)
    return documents

def create_vector_store(documents):
    os.makedirs("vectorstore", exist_ok=True)
    with open(CONTEXT_FILE, "w", encoding="utf-8") as f:
        f.write("\n\n".join(documents))
    return True

def get_context():
    if os.path.exists(CONTEXT_FILE):
        with open(CONTEXT_FILE, "r", encoding="utf-8") as f:
            return f.read()[:3000]  # Limit context size
    return None

def get_rag_response(question, use_rag=True):
    context = get_context()
    
    if use_rag and context:
        prompt = f"""You are a helpful assistant. Use the following document context to answer the question.

Document Context:
{context}

Question: {question}

Answer based on the document context above:"""
    else:
        prompt = question

    payload = {
        "model": "llama3.2",
        "prompt": prompt,
        "stream": False
    }
    
    response = requests.post(OLLAMA_URL, json=payload)
    result = response.json()
    return result["response"]