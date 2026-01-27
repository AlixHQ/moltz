# Clawd Client

A native macOS and iOS client for [Clawdbot](https://github.com/clawdbot/clawdbot) — ChatGPT-style interface for your personal AI assistant.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20iOS-blue)
![Swift](https://img.shields.io/badge/swift-5.9-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🎨 **Native SwiftUI** — Beautiful, responsive UI on macOS and iOS
- 💬 **Streaming responses** — See AI responses as they're generated
- 📎 **File attachments** — Upload images, PDFs, and documents
- 🎤 **Voice messages** — Record and send audio
- 🧠 **Thinking mode** — Enable extended reasoning for complex tasks
- 🌙 **Dark/Light mode** — Auto-follows system appearance
- 📚 **Large history** — SwiftData handles unlimited conversation history
- 🔒 **Local storage** — Your conversations stay on your device
- ⚡ **Model picker** — Choose from available AI models
- 📋 **Code highlighting** — Syntax-colored code blocks with copy button
- 📌 **Pinned chats** — Keep important conversations at the top

## Screenshots

*Coming soon*

## Requirements

- macOS 14.0+ or iOS 17.0+
- Xcode 15.0+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (for project generation)
- Running [Clawdbot Gateway](https://docs.clawd.bot/gateway)

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/dokterdok/clawd-client.git
   cd clawd-client
   ```

2. Install XcodeGen (if not already installed):
   ```bash
   brew install xcodegen
   ```

3. Generate the Xcode project:
   ```bash
   xcodegen generate
   ```

4. Open in Xcode:
   ```bash
   open ClawdClient.xcodeproj
   ```

5. Build and run (⌘R)

### Configuration

On first launch, configure your Clawdbot Gateway connection:

1. Open Settings (⌘,)
2. Enter your Gateway URL (default: `ws://localhost:18789`)
3. Enter your auth token (from `clawdbot.json`)

## Architecture

```
ClawdClient/
├── Shared/                 # Cross-platform code
│   ├── API/
│   │   └── GatewayClient.swift    # WebSocket client
│   ├── Models/
│   │   ├── Message.swift          # Message model
│   │   └── Conversation.swift     # Conversation model
│   ├── Views/
│   │   ├── ChatView.swift         # Main chat interface
│   │   ├── SidebarView.swift      # Conversation list
│   │   └── Components/
│   │       ├── MessageBubble.swift    # Message rendering
│   │       ├── ChatInputView.swift    # Input area
│   │       └── ModelPicker.swift      # Model selection
│   └── ClawdClientApp.swift       # App entry point
├── macOS/                  # macOS-specific code
├── iOS/                    # iOS-specific code
└── Resources/              # Assets, icons
```

## Development

### Building

```bash
# Generate project
xcodegen generate

# Build macOS app
xcodebuild -scheme ClawdClient-macOS -configuration Debug build

# Build iOS app
xcodebuild -scheme ClawdClient-iOS -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15 Pro' build
```

### Testing

```bash
xcodebuild test -scheme ClawdClient-macOS
```

## Roadmap

- [ ] Voice recording and playback
- [ ] Image generation display
- [ ] Markdown table rendering
- [ ] Search within conversations
- [ ] Export conversations
- [ ] iCloud sync
- [ ] Keyboard shortcuts
- [ ] Menu bar quick access (macOS)
- [ ] Widgets (iOS)
- [ ] Apple Watch companion app

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Clawdbot](https://github.com/clawdbot/clawdbot) — The AI gateway this client connects to
- [SwiftUI](https://developer.apple.com/xcode/swiftui/) — Apple's declarative UI framework
- [SwiftData](https://developer.apple.com/documentation/swiftdata) — Apple's data persistence framework

---

Made with 🦞 by the Clawdbot community
