# Nuxt AI Draw.io

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

AI-powered diagram editor that lets you create and edit draw.io diagrams using natural language. Built with [Nuxt 4](https://nuxt.com), [Nuxt UI 4](https://ui.nuxt.com), and [AI SDK v5](https://sdk.vercel.ai).

## Demo

https://github.com/user-attachments/assets/1f35562b-82c7-4ff9-9c18-f064afebfdde

## Features

- **AI-Powered Diagram Generation** - Create flowcharts, system architectures, ER diagrams, mind maps, and more using natural language
- **Embedded Draw.io Editor** - Full-featured diagram editor with real-time preview
- **Multiple AI Providers** - Support for OpenAI, Anthropic, Google AI, Azure, AWS Bedrock, OpenRouter, DeepSeek, and SiliconFlow
- **Prompt Caching** - AWS Bedrock prompt caching for Claude models to reduce costs
- **Reasoning Models** - Support for thinking/reasoning models (Claude, Gemini, OpenAI o1/o3)
- **Dark/Light Mode** - Automatic theme detection with manual toggle
- **Close Protection** - Prevent accidental page close with unsaved diagrams
- **Export Options** - Save as PNG, XML (.drawio), or Mermaid format
- **Token Usage Display** - See input/output token counts for each request
- **Access Code Protection** - Optional access code authentication

## Usage

Simply describe your diagram in natural language and the AI will generate it for you. You can also ask the AI to modify existing diagrams.

### Example Prompts

```
Create a flowchart for user login process with email verification
```

```
Design a system architecture diagram for a microservices e-commerce platform
```

```
Draw an ER diagram for a blog system with users, posts, and comments
```

```
Create a mind map about machine learning concepts
```

```
Add a database layer to the current diagram
```

### Export Options

- **PNG** - Export as image for presentations or documentation
- **XML (.drawio)** - Save as draw.io native format for further editing
- **Mermaid** - Convert to Mermaid syntax for markdown documentation

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Nuxt 4 + Vue 3 |
| UI | Nuxt UI 4 (Tailwind CSS) |
| AI SDK | Vercel AI SDK v5 |
| Diagram Engine | Draw.io (embedded iframe) |
| State Management | Vue composables |
| Icons | Lucide |

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure your AI provider:

```env
# AI Provider (openai, anthropic, google, bedrock, azure, openrouter, deepseek, siliconflow)
AI_PROVIDER=openai

# Model ID
AI_MODEL=gpt-4o

# API Key (based on provider)
OPENAI_API_KEY=sk-...
```

See `.env.example` for all available configuration options.

### 3. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supported AI Providers

| Provider | Environment Variables | Notes |
|----------|----------------------|-------|
| OpenAI | `OPENAI_API_KEY` | GPT-4o, o1, o3 models |
| Anthropic | `ANTHROPIC_API_KEY` | Claude 3.5/4 models |
| Google | `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini 2.5/3 models |
| AWS Bedrock | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Claude with prompt caching |
| Azure OpenAI | `AZURE_API_KEY`, `AZURE_RESOURCE_NAME` | Azure-hosted models |
| OpenRouter | `OPENROUTER_API_KEY` | Multi-provider routing |
| DeepSeek | `DEEPSEEK_API_KEY` | DeepSeek models |
| SiliconFlow | `SILICONFLOW_API_KEY` | SiliconFlow models |

## Project Structure

```
nuxt-ai-drawio/
├── app/
│   ├── components/
│   │   ├── ChatPanel.vue         # Chat interface
│   │   ├── DrawioEditor.vue      # Draw.io iframe wrapper
│   │   └── ...
│   ├── composables/
│   │   └── useDiagram.ts         # Diagram state management
│   ├── utils/
│   │   └── mermaid-converter.ts  # XML to Mermaid conversion
│   └── pages/
│       └── index.vue             # Main page (editor + chat)
├── server/
│   ├── api/
│   │   ├── chat.post.ts          # AI chat endpoint
│   │   └── verify-access-code.post.ts
│   └── utils/
│       ├── ai-providers.ts       # AI provider configuration
│       ├── cached-responses.ts   # Response caching
│       ├── diagram-tools.ts      # AI tools for diagrams
│       └── system-prompts.ts     # System prompts
└── nuxt.config.ts
```

## AI Tools

The AI assistant has access to three tools for diagram manipulation:

1. **display_diagram** - Create a new diagram from scratch
2. **edit_diagram** - Make targeted edits to existing diagrams
3. **append_diagram** - Continue generating truncated output

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint

# Type check
pnpm typecheck
```

## Credits

Inspired by [Nuxt UI Chat Template](https://github.com/nuxt-ui-templates/chat) and [Next AI Draw.io](https://github.com/anthropics/next-ai-draw-io).

## License

MIT
