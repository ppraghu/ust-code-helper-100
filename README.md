# ust-code-helper-100

![alt text](ust-code-helper-100-sm.png)

A powerful VSCode extension that provides AI-powered code assistance similar to GitHub Copilot, but with enterprise-grade API support and custom certificate handling. Perfect for organizations requiring secure, self-hosted, or custom AI solutions.

This extension automatically works with your exsitin certificates so it will send the certificates to the AI endpoint of your choosing ( i.e. Enterprise endpoint).

We are working on a few new agentic features that will be hopefully released very soon.

## Features

- 🤖 AI-powered code completions and suggestions
- 🔒 Enterprise-grade API support with custom certificate handling
- 🔑 Configurable API headers for authentication
- 💻 Familiar interface similar to GitHub Copilot
- ⚡ Fast and responsive code assistance
- 🛡️ Secure communication with your chosen AI endpoints

## Installation

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "UST Code Helper 100"
4. Click Install

## Configuration

Configure the extension in your VSCode settings:

```json
json
{
"ustCodeHelper100.apiEndpoint": "https://your-api-endpoint.com",
"ustCodeHelper100.apiKey": "your-api-key",
"ustCodeHelper100.certificatePath": "/path/to/certificate.pem",
"ustCodeHelper100.headers": {
"Authorization": "Bearer your-token",
"Custom-Header": "value"
}
}
```

### Required Settings

- `ustCodeHelper100.baseURL`: Your AI service endpoint also known as base URL
- `ustCodeHelper100.apiKey`: API key for authentication

### Optional Settings

- `ustCodeHelper100.certificatePath`: Path to custom SSL certificate
- `ustCodeHelper100.user`: User name for authentication
- `ustCodeHelper100.password`: Password for authentication
- `ustCodeHelper100.headers`: Additional API headers
- `ustCodeHelper100.enable`: Enable/disable the extension (default: true)

## Usage

1. Ctrl + Shift + P
2. Select 101 Start Custom AI Chat
3. The AI assistant will automatically answer your questions
4. Right click on the editor and select 101 Add to Chat Context to add the context to the current file

## Known Issues

- Currently working on improving suggestion accuracy for certain programming languages
- Performance optimization for large files is in progress

## Release Notes

### 0.0.2

- Initial release
- Basic code completion functionality
- Enterprise API support
- Custom certificate handling

### 0.0.3

- Initial release
- Basic code completion functionality
- Enterprise API support
- Custom certificate handling
- Chat history
- multi turn chat

### 0.0.4 rolling out

- agentic code insertion
- auto code completion
- auto code suggestion
- auto code explanation

### 0.0.5

- agentic code review
- active RAG

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Security

This extension supports enterprise-grade security features:

- Custom SSL certificate handling
- Secure API communication
- Configurable authentication headers

## Support

- 📫 Report issues on our [GitHub repository](https://github.com/ppraghu/ust-code-helper-100/issues)
- 📝 Read our [documentation](https://github.com/ppraghu/ust-code-helper-100/wiki)
- 💬 Join our [Discord community](https://discord.gg/your-invite-link)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Development

### Building from Source

```bash
git clone https://github.com/ppraghu/ust-code-helper-100.git
cd ust-code-helper-100
npm install
npm run build
```

For VS code extension

kindly use VSCE to build the extension and publish it to the marketplace

```bash
vsce package
```

### Running Tests

```bash
npm run test
```

For more information, visit our [GitHub repository](https://github.com/ppraghu/ust-code-helper-100.git).

**Enjoy coding with enterprise-grade AI assistance!**
