# ChatNexus

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![AI SDK](https://img.shields.io/badge/AI_SDK-Latest-purple)](https://sdk.vercel.ai/)

A modern, full-featured chat interface supporting **local AI models** (LM Studio, Ollama) and **cloud models** (AWS Bedrock) with web search capabilities.

> **ChatNexus** - Your central hub for AI conversations across multiple providers.

## Features

- 🚀 **Multi-Provider Support** - Switch between LM Studio, Ollama, and Amazon Bedrock
- ☁️ **Cloud & Local** - Use local models or powerful cloud models
- 🔍 **Web Search** - Tavily integration for real-time information
- 🎨 **Modern UI** - Built with shadcn/ui and AI Elements
- ⚡ **Real-time Streaming** - See responses as they're generated
- 🎛️ **Adjustable Settings** - Control temperature and max tokens
- 📁 **File Attachments** - Upload and discuss files
- 💬 **Message History** - Full conversation context
- 🗑️ **Clear Chat** - Clear conversation with one click
- ⌨️ **Keyboard Shortcuts** - Toggle sidebar with Cmd+B / Ctrl+B
- 🔑 **Settings Panel** - Configure API keys directly in the UI
- 🔄 **Dynamic Model Discovery** - Bedrock models automatically loaded from your AWS account
- 🔐 **Flexible Authentication** - Support for IAM roles, AWS profiles, and environment variables

## Environment Variables

Create a `.env.local` file in the project root (copy from `.env.example`):

```bash
# AWS Bedrock (optional)
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1

# Tavily Web Search (optional)
TAVILY_API_KEY=your_tavily_api_key
```

**Note:** Environment variables can also be configured directly in the UI Settings panel without restarting.

## Quick Start

### Prerequisites

- Node.js 18+
- At least one of:
  - [LM Studio](https://lmstudio.ai/) (localhost:1234)
  - [Ollama](https://ollama.com/) (localhost:11434)
  - [AWS Account](https://aws.amazon.com/) with Bedrock access

### Installation

```bash
# Clone the repository
git clone https://github.com/praveenc/chatnexus.git
cd chatnexus

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Provider Setup

### LM Studio

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download a model (e.g., Llama 3.2, Qwen 2.5)
3. Go to "Local Server" tab
4. Click "Start Server" (port 1234)
5. Load a model

### Ollama

1. Install [Ollama](https://ollama.com/)
2. Pull a model:

   ```bash
   ollama pull qwen3:14b
   ```

3. Server starts automatically on port 11434

### AWS Bedrock (Optional)

1. Create AWS Account and enable Bedrock access
2. Request model access in [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
3. Create IAM User with permissions:
   - `bedrock:InvokeModel`
   - `bedrock:InvokeModelWithResponseStream`
   - `bedrock:ListInferenceProfiles`
   - `bedrock:ListFoundationModels`

4. Configure credentials (choose one method):

   **Option A: System Environment (Recommended for Production)**
   - Use IAM roles (EC2, ECS, Lambda)
   - Use AWS profiles (`~/.aws/credentials`)
   - Set environment variables in your shell

   **Option B: UI Settings Panel**
   - Open sidebar → General tab
   - Enter AWS credentials
   - Save and restart server

   **Option C: .env File**
   ```bash
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=us-east-1
   ```

5. Available models are automatically discovered from your AWS account

### Tavily Web Search (Optional)

Enable web search for all AI models:

1. Get your free API key from [Tavily](https://docs.tavily.com/documentation/api-credits)
2. Add to UI Settings panel or `.env.local`:

   ```bash
   TAVILY_API_KEY=your_tavily_api_key
   ```

3. Restart dev server

When configured, the AI will automatically use web search to find current information and facts when needed.

## Usage

### Switching Providers

- Click on your preferred provider in the sidebar
- Available models update automatically
- Select a model from the dropdown

### Adjusting Settings

**Model Tab:**

- Temperature (0-2): Controls randomness (higher = more creative)
- Max Tokens (100-4000): Maximum response length

**General Tab:**

- Configure AWS credentials for Bedrock
- Add Tavily API key for web search
- Save and restart server for changes to take effect

### File Attachments

- Click the attachment icon in the prompt input
- Upload files to include context in your messages
- Supported formats depend on the AI model

### Keyboard Shortcuts

- `Cmd+B` / `Ctrl+B` - Toggle sidebar

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **AI SDK:** Vercel AI SDK
- **UI Components:** shadcn/ui + AI Elements
- **Styling:** Tailwind CSS
- **Providers:**
  - LM Studio (OpenAI-compatible)
  - Ollama
  - AWS Bedrock
- **Search:** Tavily API
- **Streaming:** Real-time response streaming with UI updates

## Project Structure

```text
├── app/
│   ├── api/          # API routes
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Main chat interface
├── components/
│   ├── ai-elements/  # AI UI components
│   ├── ui/           # shadcn/ui components
│   └── app-sidebar.tsx
├── lib/
│   └── providers.ts  # Provider configuration
└── docs/             # Documentation
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) - AI integration framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [LM Studio](https://lmstudio.ai/) - Local model hosting
- [Ollama](https://ollama.com/) - Local model runtime
- [Tavily](https://tavily.com/) - Web search API

## Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/praveenc/chatnexus/issues)
- 💬 [Discussions](https://github.com/praveenc/chatnexus/discussions)
