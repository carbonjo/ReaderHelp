# ReaderHelp - AI Document Assistant

ReaderHelp is a web-based tool that uses local LLMs via Ollama to help read and understand documents. It uses a powerful generation model for chat and summarization, and a dedicated embedding model for document analysis. It provides intelligent tools for document analysis, summarization, and question-answering through a beautiful, modern web interface.

## Features

- **Document Upload**: Support for PDF, DOCX, TXT, EPUB, and MD files
- **AI-Powered Analysis**: Uses a large language model for intelligent document understanding and a dedicated embedding model for high-quality retrieval.
- **Interactive Chat**: Ask questions about your documents in natural language
- **Document Summarization**: Generate comprehensive summaries of uploaded documents
- **Quick Actions**: Pre-built questions for common document analysis tasks
- **Modern UI**: Beautiful, responsive web interface with drag-and-drop file upload
- **Local Processing**: All processing happens locally using Ollama and LlamaIndex

## Prerequisites

Before running ReaderHelp, you need to have the following installed:

1. **Python 3.8+**
2. **Ollama** - [Installation Guide](https://ollama.ai/download)
3. **Required Models** - The application requires two models to be pulled in Ollama:
    - A **generation model** (e.g., `gemma3:12b`) for chat and summarization.
    - An **embedding model** (e.g., `mxbai-embed-large`) for document processing.

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ReaderHelp.git
cd ReaderHelp
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install and Setup Ollama

1. Download and install Ollama from [ollama.ai](https://ollama.ai/download)
2. Start the Ollama service.
3. Pull the required models. The default models are `gemma3:12b` and `mxbai-embed-large`.

```bash
ollama pull gemma3:12b
ollama pull mxbai-embed-large
```

### 4. Verify Ollama Setup

Check that Ollama is running and the models are available:

```bash
ollama list
```

You should see `gemma3:12b` and `mxbai-embed-large` in the list.

## Usage

### 1. Start the Application

```bash
python app.py
```

The application will start on `http://localhost:5001` by default.

### 2. Upload a Document

1. Open your web browser and navigate to `http://localhost:5001`
2. Drag and drop a document or click to browse and select a file
3. Supported formats: PDF, DOCX, TXT, EPUB, MD
4. Wait for the document to be processed (this may take a few moments for large files)

### 3. Interact with Your Document

Once a document is uploaded, you can:

- **Ask Questions**: Type questions in the chat interface
- **Generate Summary**: Click the "Generate Summary" button
- **Use Quick Actions**: Try pre-built questions like "Main Topics" or "Key Insights"
- **Clear Session**: Start fresh with a new document

## API Endpoints

- `GET /` - Main application interface
- `POST /upload` - Upload and process a document
- `POST /chat` - Send a question about the document
- `POST /summarize` - Generate a document summary
- `POST /clear` - Clear the current session
- `GET /health` - Check Ollama status and model availability.

## Project Structure

```
ReaderHelp/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main web interface
├── static/
│   ├── css/
│   │   └── style.css     # Application styling
│   ├── js/
│   │   └── app.js        # Frontend JavaScript
│   └── uploads/          # Uploaded documents (auto-created)
└── chroma_db_*/          # Vector database files (auto-created)
```

## Configuration

### Environment Variables

- `SECRET_KEY`: Flask secret key (defaults to a development key).
- `OLLAMA_HOST`: Ollama server host (defaults to `localhost:11434`).

### Model Configuration

The application is configured to use two different models, which can be changed in `app.py`:

- **`MODEL_NAME`**: The main language model for generation tasks like chat and summarization.
- **`EMBEDDING_MODEL_NAME`**: The model used to generate embeddings for document retrieval.

To use different models:

1. Update the model names in `app.py`:
   ```python
   # The model for chat and summarization
   MODEL_NAME = "your-generation-model"

   # The model for creating embeddings
   EMBEDDING_MODEL_NAME = "your-embedding-model"
   ```

2. Ensure the models are available in Ollama:
   ```bash
   ollama pull your-generation-model
   ollama pull your-embedding-model
   ```

## Troubleshooting

### Common Issues

1. **Ollama not running**
   - Start Ollama: `ollama serve`
   - Check status: `ollama list`

2. **Model not found**
   - Pull the required models:
     ```bash
     ollama pull gemma3:12b
     ollama pull mxbai-embed-large
     ```
   - Verify installation: `ollama list`
   - Check the `/health` endpoint of the application.

3. **Port already in use**
   - The application runs on port 5001 by default. If this port is taken, you can change it in `app.py`:
     ```python
     app.run(debug=True, host='0.0.0.0', port=5002)
     ```

4. **Memory issues with large documents**
   - The application processes documents in chunks.
   - For very large documents, consider splitting them into smaller files.

### Performance Tips

- **RAM**: The `gemma3:12b` model requires significant RAM (16GB+ recommended for good performance). The embedding model also consumes RAM.
- **GPU**: For the best performance, ensure Ollama is configured to use your GPU.
- **Document Size**: Large documents will take longer to process during the initial upload.

## Development

### Running in Development Mode

```bash
export FLASK_ENV=development
python app.py
```

### Adding New Features

1. **New Document Types**: Add file extensions to `ALLOWED_EXTENSIONS` in `app.py`.
2. **New Chat Features**: Extend the `/chat` endpoint in `app.py`.
3. **UI Improvements**: Modify `templates/index.html` and `static/css/style.css`.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **LlamaIndex**: For the document processing and vector indexing capabilities.
- **Ollama**: For providing easy local LLM deployment.
- **Flask**: For the web framework.
- **Bootstrap**: For the responsive UI components.

## Support

If you encounter any issues:

1. Check the troubleshooting section above.
2. Verify Ollama is running and the required models are available using `ollama list` and the `/health` endpoint.
3. Check the browser console for JavaScript errors.
4. Review the Flask application logs for Python errors.

For additional support, please open an issue on the GitHub repository.
