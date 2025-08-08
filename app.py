import os
import json
from flask import Flask, render_template, request, jsonify, session
from werkzeug.utils import secure_filename
from llama_index.core import VectorStoreIndex, Document
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.storage import StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from datetime import datetime
import uuid

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configuration
MODEL_NAME = "gemma3:12b"
EMBEDDING_MODEL_NAME = "mxbai-embed-large"
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'epub', 'md'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Ollama LLM and embeddings
llm = Ollama(model=MODEL_NAME, request_timeout=120.0)
embed_model = OllamaEmbedding(model_name=EMBEDDING_MODEL_NAME)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_document(file_path):
    """Load document based on file type"""
    file_extension = file_path.rsplit('.', 1)[1].lower()
    
    if file_extension == 'pdf':
        from llama_index.readers.file import PDFReader
        loader = PDFReader()
        documents = loader.load_data(file_path)
    elif file_extension == 'docx':
        from llama_index.readers.file import DocxReader
        loader = DocxReader()
        documents = loader.load_data(file_path)
    elif file_extension == 'epub':
        from llama_index.readers.file import EpubReader
        loader = EpubReader()
        documents = loader.load_data(file_path)
    else:  # txt, md, etc.
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        documents = [Document(text=text)]
    
    return documents

def create_index(documents, session_id):
    """Create a vector index for the documents"""
    # Initialize ChromaDB
    chroma_client = chromadb.PersistentClient(path=f"./chroma_db_{session_id}")
    chroma_collection = chroma_client.get_or_create_collection(f"reader_help_{session_id}")
    
    # Create vector store
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    
    # Create index
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        embed_model=embed_model,
        llm=llm
    )
    
    return index

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Generate session ID for this document
        session_id = str(uuid.uuid4())
        session['session_id'] = session_id
        
        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # Load and process document
            documents = load_document(file_path)
            
            # Create index
            index = create_index(documents, session_id)
            
            # Store document info in session
            session['document_name'] = filename
            session['document_path'] = file_path
            
            return jsonify({
                'success': True,
                'message': f'Document "{filename}" uploaded and processed successfully!',
                'session_id': session_id
            })
            
        except Exception as e:
            return jsonify({'error': f'Error processing document: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    session_id = session.get('session_id')
    
    if not session_id:
        return jsonify({'error': 'No document loaded. Please upload a document first.'}), 400
    
    try:
        # Load the existing index
        chroma_client = chromadb.PersistentClient(path=f"./chroma_db_{session_id}")
        chroma_collection = chroma_client.get_collection(f"reader_help_{session_id}")
        vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        # Load index from storage
        index = VectorStoreIndex.from_vector_store(
            vector_store,
            storage_context=storage_context,
            embed_model=embed_model,
            llm=llm
        )
        
        # Create query engine
        query_engine = index.as_query_engine()
        
        # Get response
        response = query_engine.query(user_message)
        
        return jsonify({
            'response': str(response),
            'sources': [str(node.node_id) for node in response.source_nodes] if hasattr(response, 'source_nodes') else []
        })
        
    except Exception as e:
        return jsonify({'error': f'Error processing query: {str(e)}'}), 500

@app.route('/summarize', methods=['POST'])
def summarize():
    session_id = session.get('session_id')
    
    if not session_id:
        return jsonify({'error': 'No document loaded. Please upload a document first.'}), 400
    
    try:
        # Load the existing index
        chroma_client = chromadb.PersistentClient(path=f"./chroma_db_{session_id}")
        chroma_collection = chroma_client.get_collection(f"reader_help_{session_id}")
        vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        # Load index from storage
        index = VectorStoreIndex.from_vector_store(
            vector_store,
            storage_context=storage_context,
            embed_model=embed_model,
            llm=llm
        )
        
        # Create query engine for summarization
        query_engine = index.as_query_engine()
        
        # Get summary
        summary = query_engine.query("Please provide a comprehensive summary of this document, highlighting the main points and key insights.")
        
        return jsonify({
            'summary': str(summary)
        })
        
    except Exception as e:
        return jsonify({'error': f'Error generating summary: {str(e)}'}), 500

@app.route('/clear', methods=['POST'])
def clear_session():
    session_id = session.get('session_id')
    if session_id:
        # Clean up ChromaDB
        try:
            import shutil
            chroma_path = f"./chroma_db_{session_id}"
            if os.path.exists(chroma_path):
                shutil.rmtree(chroma_path)
        except Exception as e:
            print(f"Error cleaning up ChromaDB: {e}")
    
    # Clear session
    session.clear()
    
    return jsonify({'success': True, 'message': 'Session cleared successfully'})

@app.route('/health', methods=['GET'])
def health_check():
    """Check if Ollama is running and the required models are available"""
    try:
        import requests
        response = requests.get('http://localhost:11434/api/tags', timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            model_names = [model.get('name', '') for model in models]
            llm_model_available = any(MODEL_NAME in name for name in model_names)
            embedding_model_available = any(EMBEDDING_MODEL_NAME in name for name in model_names)
            return jsonify({
                'ollama_running': True,
                'llm_model_available': llm_model_available,
                'embedding_model_available': embedding_model_available
            })
        else:
            return jsonify({
                'ollama_running': False,
                'llm_model_available': False,
                'embedding_model_available': False
            })
    except Exception as e:
        return jsonify({
            'ollama_running': False,
            'llm_model_available': False,
            'embedding_model_available': False,
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
