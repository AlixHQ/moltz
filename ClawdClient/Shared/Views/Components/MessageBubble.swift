import SwiftUI

/// A single message bubble with markdown rendering and code highlighting
struct MessageBubble: View {
    let message: Message
    @State private var showThinking = false
    @State private var copiedCodeBlock: String?
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Avatar
            Avatar(role: message.role)
            
            VStack(alignment: .leading, spacing: 8) {
                // Role label
                Text(message.role == .user ? "You" : "Clawd")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                
                // Content
                if message.isStreaming && message.content.isEmpty {
                    TypingIndicator()
                } else {
                    MessageContent(
                        content: message.content,
                        onCopyCode: { code in
                            copyToClipboard(code)
                            copiedCodeBlock = code
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                copiedCodeBlock = nil
                            }
                        },
                        copiedBlock: copiedCodeBlock
                    )
                }
                
                // Thinking disclosure (if available)
                if let thinking = message.thinkingContent, !thinking.isEmpty {
                    DisclosureGroup("View thinking", isExpanded: $showThinking) {
                        Text(thinking)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(8)
                            .background(Color.secondary.opacity(0.1))
                            .cornerRadius(8)
                    }
                    .font(.caption)
                }
                
                // Attachments
                if !message.attachments.isEmpty {
                    AttachmentPreview(attachments: message.attachments)
                }
                
                // Sources
                if !message.sources.isEmpty {
                    SourcesView(sources: message.sources)
                }
                
                // Model badge
                if let model = message.modelUsed {
                    Text(model)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .padding(.top, 4)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 8)
    }
    
    private func copyToClipboard(_ text: String) {
        #if os(macOS)
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        #else
        UIPasteboard.general.string = text
        #endif
    }
}

/// Avatar for user/assistant
struct Avatar: View {
    let role: MessageRole
    
    var body: some View {
        ZStack {
            Circle()
                .fill(role == .user ? Color.blue : Color.orange)
                .frame(width: 32, height: 32)
            
            Image(systemName: role == .user ? "person.fill" : "sparkles")
                .font(.system(size: 14))
                .foregroundStyle(.white)
        }
    }
}

/// Typing indicator animation
struct TypingIndicator: View {
    @State private var animating = false
    
    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Color.secondary)
                    .frame(width: 6, height: 6)
                    .offset(y: animating ? -4 : 0)
                    .animation(
                        .easeInOut(duration: 0.4)
                        .repeatForever()
                        .delay(Double(i) * 0.15),
                        value: animating
                    )
            }
        }
        .onAppear { animating = true }
    }
}

/// Renders markdown content with code block highlighting
struct MessageContent: View {
    let content: String
    let onCopyCode: (String) -> Void
    let copiedBlock: String?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(parseContent(), id: \.id) { block in
                switch block.type {
                case .text:
                    Text(LocalizedStringKey(block.content))
                        .textSelection(.enabled)
                case .code(let language):
                    CodeBlock(
                        code: block.content,
                        language: language,
                        isCopied: copiedBlock == block.content,
                        onCopy: { onCopyCode(block.content) }
                    )
                }
            }
        }
    }
    
    private func parseContent() -> [ContentBlock] {
        var blocks: [ContentBlock] = []
        var remaining = content
        
        let codePattern = /```(\w*)\n([\s\S]*?)```/
        
        while let match = remaining.firstMatch(of: codePattern) {
            // Add text before code block
            let textBefore = String(remaining[remaining.startIndex..<match.range.lowerBound])
            if !textBefore.isEmpty {
                blocks.append(ContentBlock(type: .text, content: textBefore))
            }
            
            // Add code block
            let language = String(match.1)
            let code = String(match.2).trimmingCharacters(in: .whitespacesAndNewlines)
            blocks.append(ContentBlock(type: .code(language: language), content: code))
            
            remaining = String(remaining[match.range.upperBound...])
        }
        
        // Add remaining text
        if !remaining.isEmpty {
            blocks.append(ContentBlock(type: .text, content: remaining))
        }
        
        return blocks
    }
}

struct ContentBlock: Identifiable {
    let id = UUID()
    let type: ContentBlockType
    let content: String
}

enum ContentBlockType {
    case text
    case code(language: String)
}

/// Code block with syntax highlighting and copy button
struct CodeBlock: View {
    let code: String
    let language: String
    let isCopied: Bool
    let onCopy: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header with language and copy button
            HStack {
                Text(language.isEmpty ? "code" : language)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                Button(action: onCopy) {
                    Label(
                        isCopied ? "Copied!" : "Copy",
                        systemImage: isCopied ? "checkmark" : "doc.on.doc"
                    )
                    .font(.caption)
                }
                .buttonStyle(.plain)
                .foregroundStyle(isCopied ? .green : .secondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.secondary.opacity(0.15))
            
            // Code content
            ScrollView(.horizontal, showsIndicators: false) {
                Text(code)
                    .font(.system(.body, design: .monospaced))
                    .textSelection(.enabled)
                    .padding(12)
            }
            .background(Color.secondary.opacity(0.08))
        }
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
        )
    }
}

/// Preview attachments
struct AttachmentPreview: View {
    let attachments: [Attachment]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(attachments, id: \.id) { attachment in
                    AttachmentThumbnail(attachment: attachment)
                }
            }
        }
    }
}

struct AttachmentThumbnail: View {
    let attachment: Attachment
    
    var body: some View {
        VStack {
            if attachment.mimeType.hasPrefix("image/"), let data = attachment.data {
                #if os(macOS)
                if let nsImage = NSImage(data: data) {
                    Image(nsImage: nsImage)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 80, height: 80)
                        .clipped()
                }
                #else
                if let uiImage = UIImage(data: data) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 80, height: 80)
                        .clipped()
                }
                #endif
            } else {
                Image(systemName: "doc.fill")
                    .font(.title)
                    .frame(width: 80, height: 80)
            }
            
            Text(attachment.filename)
                .font(.caption2)
                .lineLimit(1)
        }
        .padding(4)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(8)
    }
}

/// Sources at bottom of message
struct SourcesView: View {
    let sources: [Source]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Sources")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)
            
            ForEach(sources, id: \.title) { source in
                HStack(spacing: 4) {
                    Image(systemName: "link")
                        .font(.caption2)
                    
                    if let url = source.url {
                        Link(source.title, destination: URL(string: url)!)
                            .font(.caption)
                    } else {
                        Text(source.title)
                            .font(.caption)
                    }
                }
            }
        }
        .padding(8)
        .background(Color.secondary.opacity(0.08))
        .cornerRadius(8)
    }
}
