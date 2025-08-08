// Global variables
let currentSessionId = null;
let isProcessing = false;

// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadStatus = document.getElementById('uploadStatus');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const documentInfo = document.getElementById('documentInfo');
const documentName = document.getElementById('documentName');
const quickActions = document.getElementById('quickActions');
const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
const loadingMessage = document.getElementById('loadingMessage');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDragAndDrop();
});

// Setup event listeners
function setupEventListeners() {
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Message input
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Upload area click
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
}

// Setup drag and drop
function setupDragAndDrop() {
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Handle file upload
function handleFile(file) {
    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt', '.epub', '.md'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showStatus('Please select a valid file type (PDF, DOCX, TXT, EPUB, MD)', 'error');
        return;
    }
    
    // Show loading state
    showLoading('Uploading and processing document...');
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload file
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        if (data.success) {
            currentSessionId = data.session_id;
            showStatus(data.message, 'success');
            enableChat();
            showDocumentInfo(file.name);
            showQuickActions();
            addBotMessage('Document uploaded successfully! You can now ask questions about it.');
        } else {
            showStatus(data.error, 'error');
        }
    })
    .catch(error => {
        hideLoading();
        showStatus('Error uploading file: ' + error.message, 'error');
    });
}

// Send message
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;
    
    // Add user message to chat
    addUserMessage(message);
    messageInput.value = '';
    
    // Show loading state
    isProcessing = true;
    sendButton.disabled = true;
    messageInput.disabled = true;
    
    // Send to backend
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        isProcessing = false;
        sendButton.disabled = false;
        messageInput.disabled = false;
        
        if (data.error) {
            addBotMessage('Error: ' + data.error, 'error');
        } else {
            addBotMessage(data.response);
        }
    })
    .catch(error => {
        isProcessing = false;
        sendButton.disabled = false;
        messageInput.disabled = false;
        addBotMessage('Error: ' + error.message, 'error');
    });
}

// Generate summary
function generateSummary() {
    if (!currentSessionId) {
        showStatus('Please upload a document first', 'error');
        return;
    }
    
    showLoading('Generating summary...');
    
    fetch('/summarize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        
        if (data.error) {
            addBotMessage('Error: ' + data.error, 'error');
        } else {
            addBotMessage('**Summary:**\n\n' + data.summary);
        }
    })
    .catch(error => {
        hideLoading();
        addBotMessage('Error: ' + error.message, 'error');
    });
}

// Ask a specific question
function askQuestion(question) {
    if (!currentSessionId) {
        showStatus('Please upload a document first', 'error');
        return;
    }
    
    // Add user message
    addUserMessage(question);
    
    // Show loading state
    isProcessing = true;
    sendButton.disabled = true;
    messageInput.disabled = true;
    
    // Send to backend
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: question })
    })
    .then(response => response.json())
    .then(data => {
        isProcessing = false;
        sendButton.disabled = false;
        messageInput.disabled = false;
        
        if (data.error) {
            addBotMessage('Error: ' + data.error, 'error');
        } else {
            addBotMessage(data.response);
        }
    })
    .catch(error => {
        isProcessing = false;
        sendButton.disabled = false;
        messageInput.disabled = false;
        addBotMessage('Error: ' + error.message, 'error');
    });
}

// Clear session
function clearSession() {
    if (!currentSessionId) return;
    
    fetch('/clear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentSessionId = null;
            disableChat();
            hideDocumentInfo();
            hideQuickActions();
            clearChat();
            addBotMessage('Session cleared. Please upload a new document to continue.');
        }
    })
    .catch(error => {
        addBotMessage('Error clearing session: ' + error.message, 'error');
    });
}

// Add user message to chat
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas fa-user"></i>
            <div class="message-bubble">
                <strong>You</strong>
                <p>${escapeHtml(message)}</p>
            </div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Add bot message to chat
function addBotMessage(message, type = 'normal') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    let messageClass = '';
    if (type === 'error') {
        messageClass = 'text-danger';
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas fa-robot"></i>
            <div class="message-bubble ${messageClass}">
                <strong>ReaderHelp Assistant</strong>
                <div>${formatMessage(message)}</div>
            </div>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Format message (convert markdown-like syntax)
function formatMessage(message) {
    // Convert **text** to bold
    message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert line breaks to <br>
    message = message.replace(/\n/g, '<br>');
    
    return message;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll to bottom of chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enable chat interface
function enableChat() {
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
}

// Disable chat interface
function disableChat() {
    messageInput.disabled = true;
    sendButton.disabled = true;
}

// Show document info
function showDocumentInfo(filename) {
    documentName.textContent = filename;
    documentInfo.style.display = 'block';
}

// Hide document info
function hideDocumentInfo() {
    documentInfo.style.display = 'none';
}

// Show quick actions
function showQuickActions() {
    quickActions.style.display = 'block';
}

// Hide quick actions
function hideQuickActions() {
    quickActions.style.display = 'none';
}

// Clear chat
function clearChat() {
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="message bot-message">
                <div class="message-content">
                    <i class="fas fa-robot"></i>
                    <div>
                        <strong>ReaderHelp Assistant</strong>
                        <p>Hello! I'm here to help you understand your documents. Please upload a document to get started.</p>
                        <p class="small text-muted">Supported formats: PDF, DOCX, TXT, EPUB, MD</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show status message
function showStatus(message, type = 'info') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type}`;
    statusDiv.textContent = message;
    
    uploadStatus.innerHTML = '';
    uploadStatus.appendChild(statusDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (statusDiv.parentNode) {
            statusDiv.parentNode.removeChild(statusDiv);
        }
    }, 5000);
}

// Show loading modal
function showLoading(message) {
    loadingMessage.textContent = message;
    loadingModal.show();
}

// Hide loading modal
function hideLoading() {
    loadingModal.hide();
}

// Utility function to check if Ollama is running
function checkOllamaStatus() {
    fetch('/health', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (!data.ollama_running) {
            addBotMessage('Warning: Ollama is not running. Please start Ollama and ensure the gemma2:12b model is available.', 'error');
        }
    })
    .catch(error => {
        console.log('Health check failed:', error);
    });
}

// Check Ollama status on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(checkOllamaStatus, 1000);
});
