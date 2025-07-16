export function getWebviewContent() {
  return `
        <!DOCTYPE html>
        <html>
                <head>
            <style>
                body {
                    margin: 0;
                    padding: 10px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                }
                #chat-container {
                    display: flex;
                    flex-direction: column;
                    height: 95vh;
                    gap: 10px;
                }
                #messages {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 10px;
                    padding: 6px;
                    /*
                    // border: 1px solid var(--vscode-input-border);
                    // border-radius: 4px;
                    */
                }
                .message {
                    margin: 8px 0;
                    padding: 12px;
                    border-radius: 6px;
                    width: 96%;
                    word-wrap: break-word;
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                }
                .user-message {
                    /*
                    // background-color: var(--vscode-editor-background);
                    // border: 1px solid var(--vscode-input-border);
                    // margin-left: auto;
                    */
                }
                .ai-message {
                    /*
                    // background-color: var(--vscode-editor-selectionBackground);
                    // color: var(--vscode-editor-foreground);
                    // margin-right: auto;
                    */
                }

                .message-container {
                    position: relative;
                    margin: 8px 0;
                }

                .copy-button {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    padding: 4px 8px;
                    font-size: 12px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }

                .copy-button:hover {
                    opacity: 1;
                }


                #input-container {
                    display: flex;
                    gap: 8px;
                    padding: 10px;
                    background-color: var(--vscode-editor-background);
                    border-radius: 4px;
                    align-items: flex-start; // Add this to align button with top of textarea
                }

                #message-input {
                    flex: 1;
                    padding: 8px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    font-size: 10px;
                    resize: none; // Prevents manual resizing
                    min-height: 40px;
                    max-height: 200px; // Approximately 10 lines
                    font-family: Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                }
                #message-input:focus {
                    outline: none;
                    border-color: var(--vscode-focusBorder);
                }
                button {
                    padding: 8px 16px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .error-message {
                    color: var(--vscode-errorForeground);
                    background-color: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                }
                
                .model-selector {
                    margin-bottom: 10px;
                    padding: 8px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    width: 200px;
                }
                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    padding: 4px;
                    font-size: 12px;
                }

                @keyframes flash {
                    0% { opacity: 0.5; }
                    100% { opacity: 1; }
                }

                .context-files {
                    margin: 8px 0;
                    padding: 8px;
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    font-size: 12px;
                }

                .context-file {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 4px;
                }

                .context-file button {
                    padding: 2px 6px;
                    font-size: 10px;
                }

                #model-display {
                    padding: 3px 6px;
                    font-size: 10px;
                    border-radius: 3px;
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                }

                .toolbar-buttons button {
                    padding: 3px 6px;
                    font-size: 8px;
                    border-radius: 3px;                
                }

                .loading-message {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 8px 0;
                    padding: 12px;
                    border-radius: 6px;
                    width: 100%;
                    background-color: var(--vscode-editor-selectionBackground);
                    color: var(--vscode-editor-foreground);
                    margin-right: auto;
                }

                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-5px); }
                }

                .loading-dots {
                    display: flex;
                    gap: 4px;
                }

                .dot {
                    width: 6px;
                    height: 6px;
                    background-color: var(--vscode-editor-foreground);
                    border-radius: 50%;
                }

                .dot:nth-child(1) { animation: bounce 1.4s infinite 0s; }
                .dot:nth-child(2) { animation: bounce 1.4s infinite 0.2s; }
                .dot:nth-child(3) { animation: bounce 1.4s infinite 0.4s; }

                .toolbar-buttons {
                    display: flex;
                    gap: 4px;
                }

                .code-block-container {
                    position: relative;
                    margin: 1em 0;
                }

                .code-copy-button {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    padding: 4px 8px;
                    font-size: 12px;
                    background-color: #9c27b0; /* Purple color */
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }

                .code-copy-button:hover {
                    opacity: 1;
                }

                pre {
                    position: relative;
                    padding: 1em;
                    background-color: var(--vscode-editor-background);
                    border-radius: 4px;
                    overflow: auto;
                    margin: 0;
                }

                code {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 14px;
                }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/styles/default.min.css">
            <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/highlight.min.js"></script>
        </head>



        
<body>
    <div id="chat-container">
        <div class="toolbar">
            <div class="toolbar-buttons">
                <button id="new-chat" >New Chat</button>
                <button id="show-history">Show History</button>
                <button id="change-model">Change Model</button>
            </div>
            <span id="model-display">Current Model: <span id="current-model"></span></span>
        </div>
        <div id="context-files" class="context-files" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span>Context Files:</span>
                <button id="clear-context" style="font-size: 10px;">Clear All</button>
            </div>
            <div id="context-files-list"></div>
        </div>
        <div id="messages"></div>
        <div id="input-container">
            <textarea 
                id="message-input" 
                placeholder="Type your message... (Shift+Enter for new line)"
                rows="3"
            ></textarea>
            <button id="send-button">Send</button>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const changeModelButton = document.getElementById('change-model');
        const currentModelSpan = document.getElementById('current-model');

        let messages = [];

        // Add the message handling function

        // function addMessage(text, isUser = true, isError = false) {
        //     const messageDiv = document.createElement('div');
        //     messageDiv.className = \`message \${isUser ? 'user-message' : 'ai-message'} \${isError ? 'error-message' : ''}\`;
            
        //     if (isUser) {
        //         messageDiv.textContent = text;
        //     } else {
        //         // Parse markdown for AI responses
        //         messageDiv.innerHTML = marked.parse(text);
        //         // Apply syntax highlighting to code blocks
        //         messageDiv.querySelectorAll('pre code').forEach((block) => {
        //             hljs.highlightBlock(block);
        //         });
        //     }
        //     messagesContainer.appendChild(messageDiv);
        //     messagesContainer.scrollTop = messagesContainer.scrollHeight;
        // }


        // Update the addMessage function in the <script> section
        function addMessage(text, isUser = true, isError = false) {
            const messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';

            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${isUser ? 'user-message' : 'ai-message'} \${isError ? 'error-message' : ''}\`;
            
            if (isUser) {
                messageDiv.textContent = text;
            } else {
                // Parse markdown for AI responses
                messageDiv.innerHTML = marked.parse(text);
                
                // Add copy button for the entire message
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-button';
                copyButton.textContent = 'Copy All';
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(text)
                        .then(() => {
                            copyButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyButton.textContent = 'Copy All';
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Failed to copy:', err);
                            copyButton.textContent = 'Failed';
                        });
                };
                messageContainer.appendChild(copyButton);

                // Add copy buttons for each code block
                messageDiv.querySelectorAll('pre code').forEach((block) => {
                    // Apply syntax highlighting
                    hljs.highlightBlock(block);

                    // Create container for code block and its button
                    const codeContainer = document.createElement('div');
                    codeContainer.className = 'code-block-container';

                    // Create copy button for this specific code block
                    const codeCopyButton = document.createElement('button');
                    codeCopyButton.className = 'code-copy-button';
                    codeCopyButton.textContent = 'Copy Code';
                    codeCopyButton.onclick = () => {
                        navigator.clipboard.writeText(block.textContent || '')
                            .then(() => {
                                codeCopyButton.textContent = 'Copied!';
                                setTimeout(() => {
                                    codeCopyButton.textContent = 'Copy Code';
                                }, 2000);
                            })
                            .catch(err => {
                                console.error('Failed to copy code:', err);
                                codeCopyButton.textContent = 'Failed';
                            });
                    };

                    // Wrap the code block in the container with its button
                    const preElement = block.parentElement;
                    if (preElement && preElement.parentElement) {
                        preElement.parentElement.insertBefore(codeContainer, preElement);
                        codeContainer.appendChild(preElement);
                        codeContainer.appendChild(codeCopyButton);
                    }
                });
            }
            
            messageContainer.appendChild(messageDiv);
            messagesContainer.appendChild(messageContainer);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }



        // Add these functions in your JavaScript section
        function addLoadingIndicator() {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-message';
            loadingDiv.id = 'loading-indicator';
            
            loadingDiv.innerHTML = \`
                Thinking
                <div class="loading-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            \`;
            
            messagesContainer.appendChild(loadingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function removeLoadingIndicator() {
            const loadingDiv = document.getElementById('loading-indicator');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }

        function updateContextFiles(files) {
            const contextFiles = document.getElementById('context-files');
            const filesList = document.getElementById('context-files-list');
            
            if (files.length === 0) {
                contextFiles.style.display = 'none';
                return;
            }
            
            contextFiles.style.display = 'block';
            filesList.innerHTML = files.map(file => \`
                <div class="context-file">
                    <span>\${file}</span>
                    <button onclick="removeFromContext('\${file}')">Remove</button>
                </div>
            \`).join('');
        }

        function removeFromContext(file) {
            vscode.postMessage({
                command: 'removeFromContext',
                file: file
            });
        }


        // Add the message sending function
        function sendMessage() {
            const messageText = document.getElementById('message-input').value;
            if (messageText.trim()) {
                // Display user message immediately
                addMessage(messageText, true);
                
                // Add user message to messages array
                messages.push({
                    role: 'user',
                    content: messageText,
                    timestamp: Date.now()
                });
                
                // Add loading indicator
                addLoadingIndicator();
                
                // Send to extension
                vscode.postMessage({
                    command: 'sendMessage',
                    text: messageText,
                    messages: messages
                });
                
                // Clear input
                document.getElementById('message-input').value = '';
            }
        }

        // Add event listeners
        changeModelButton.addEventListener('click', () => {
            vscode.postMessage({
                command: 'changeModel'
            });
        });

        sendButton.addEventListener('click', sendMessage);
        // Update the keypress event listener in the JavaScript section
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Allow the default behavior for Shift+Enter (new line)
                    return;
                } else {
                    e.preventDefault(); // Prevent default to avoid unwanted newline
                    sendMessage();
                }
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Received message:', message);
            
            switch (message.command) {
                case 'receiveResponse':
                    removeLoadingIndicator();
                    if (message.text) {
                        const isError = message.text.startsWith('Error:');
                        addMessage(message.text, false, isError);
                    } else {
                        addMessage('Received empty response from API', false, true);
                    }
                    break;

                case 'updateModel':
                    if (message.model) {
                            currentModelSpan.textContent = message.model;
                            // Add a visual feedback for model change
                            const modelDisplay = document.getElementById('model-display');
                            modelDisplay.style.animation = 'none';
                            modelDisplay.offsetHeight; // Trigger reflow
                            modelDisplay.style.animation = 'flash 0.5s';
                    }
                    break;

                case 'updateContext':
                    updateContextFiles(message.files);
                    break;
            }
        });

        // Add this JavaScript right after your existing event listeners
        messageInput.addEventListener('input', function() {
            // Reset height to auto to get the correct scrollHeight
            this.style.height = 'auto';
            
            // Set new height based on content
            const newHeight = Math.min(this.scrollHeight, 200); // 200px is max height
            this.style.height = newHeight + 'px';
        });

        // Focus input on load
        messageInput.focus();

        // Add this to your webview's message handling
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Received message:', message);
            switch (message.command) {
                case 'clearChat':
                    // Clear UI
                    document.getElementById('messages').innerHTML = '';
                    // Clear messages array if it's a new session
                    if (message.newSession) {
                        messages = [];
                        console.log('Cleared messages array for new session');
                    }
                    break;
                case 'loadPreviousChat':
                    console.log('Loading previous chat:', message.messages);
                    if (message.messages) {
                        // Clear existing messages first
                        messages = [];
                        document.getElementById('messages').innerHTML = '';
                        
                        // Load the messages
                        messages = message.messages;
                        message.messages.forEach(msg => {
                            addMessage(msg.content, msg.role === 'user');
                        });
                    }
                    break;
                // ... other cases
            }
        });

        // Add this function to save messages whenever a new message is added
        function saveMessages() {
            const messages = getAllMessages(); // Implement this to get all messages from your UI
            vscode.postMessage({
                type: 'saveChat',
                messages: messages
            });
        }

        document.getElementById('new-chat').addEventListener('click', () => {
            // Clear local messages immediately for better UX
            document.getElementById('messages').innerHTML = '';
            messages = [];
            vscode.postMessage({ command: 'newChat' });
        });

        // Add message handler for clearing chat
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'clearChat':
                    // Clear UI
                    document.getElementById('messages').innerHTML = '';
                    // Clear messages array if it's a new session
                    if (message.newSession) {
                        messages = [];
                        console.log('Cleared messages array for new session');
                    }
                    break;
                // ... existing cases ...
            }
        });

        document.getElementById('show-history').addEventListener('click', () => {
            vscode.postMessage({ command: 'showHistory' });
        });

        // Add this to your message handling
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'receiveResponse':
                    // Add the AI response to messages
                    messages.push({
                        role: 'assistant',
                        content: message.text,
                        timestamp: Date.now()
                    });
                    // Update the UI with the response
                    // ... your existing response handling code ...
                    break;
                    
                case 'requestMessages':
                    // Send the current messages back to the extension
                    vscode.postMessage({
                        command: 'updateMessages',
                        messages: messages
                    });
                    break;
            }
        });

        // Handle clearing chat
        function clearChat() {
            messages = [];
            // ... your existing clear chat code ...
        }

        // When loading previous chat
        function loadPreviousChat(loadedMessages) {
            messages = loadedMessages;
            // ... your existing load chat code ...
        }
    </script>
</body>


        </html>
    `;
}
