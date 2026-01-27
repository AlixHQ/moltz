import SwiftUI
import SwiftData

/// Main chat view with message list and input
struct ChatView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject var gateway: GatewayClient
    
    @Bindable var conversation: Conversation
    @State private var inputText = ""
    @State private var isLoading = false
    @State private var attachments: [Attachment] = []
    @State private var showingFilePicker = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Messages list
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(sortedMessages) { message in
                            MessageBubble(message: message)
                                .id(message.id)
                        }
                        
                        if isLoading {
                            LoadingIndicator()
                        }
                    }
                    .padding()
                }
                .onChange(of: sortedMessages.count) { _, _ in
                    if let lastMessage = sortedMessages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
            }
            
            Divider()
            
            // Input area
            ChatInputView(
                text: $inputText,
                attachments: $attachments,
                isLoading: isLoading,
                onSend: sendMessage,
                onAttach: { showingFilePicker = true }
            )
        }
        .navigationTitle(conversation.title)
        #if os(macOS)
        .navigationSubtitle(conversation.model ?? "Auto")
        #endif
        .toolbar {
            ToolbarItemGroup {
                // Model picker
                ModelPicker(selectedModel: Binding(
                    get: { conversation.model },
                    set: { conversation.model = $0 }
                ))
                
                // Thinking toggle
                if supportsThinking {
                    Toggle(isOn: $conversation.thinkingEnabled) {
                        Label("Thinking", systemImage: "brain")
                    }
                    .help("Enable extended thinking")
                }
            }
        }
        .fileImporter(
            isPresented: $showingFilePicker,
            allowedContentTypes: [.image, .pdf, .plainText, .data],
            allowsMultipleSelection: true
        ) { result in
            handleFileImport(result)
        }
    }
    
    private var sortedMessages: [Message] {
        (conversation.messages ?? []).sorted { $0.timestamp < $1.timestamp }
    }
    
    private var supportsThinking: Bool {
        guard let model = conversation.model else { return true }
        return ModelOption.defaults.first { $0.id == model }?.supportsThinking ?? false
    }
    
    private func sendMessage() {
        guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        let content = inputText
        inputText = ""
        
        // Create user message
        let userMessage = Message(
            conversationId: conversation.id,
            role: .user,
            content: content,
            attachments: attachments
        )
        modelContext.insert(userMessage)
        
        // Update conversation title if first message
        if (conversation.messages?.count ?? 0) <= 1 {
            conversation.generateTitle(from: content)
        }
        
        // Create placeholder for assistant response
        let assistantMessage = Message(
            conversationId: conversation.id,
            role: .assistant,
            isStreaming: true
        )
        modelContext.insert(assistantMessage)
        
        // Clear attachments
        attachments = []
        isLoading = true
        
        // Send to gateway
        Task {
            do {
                try await gateway.sendMessage(
                    content: content,
                    conversationId: conversation.id,
                    model: conversation.model,
                    thinkingEnabled: conversation.thinkingEnabled,
                    attachments: userMessage.attachments,
                    onStream: { chunk in
                        Task { @MainActor in
                            assistantMessage.content += chunk
                        }
                    },
                    onComplete: { response in
                        Task { @MainActor in
                            assistantMessage.isStreaming = false
                            assistantMessage.modelUsed = response.result?.model
                            if let sources = response.result?.sources {
                                assistantMessage.sources = sources
                            }
                            if let thinking = response.result?.thinking {
                                assistantMessage.thinkingContent = thinking
                            }
                            isLoading = false
                            conversation.updatedAt = Date()
                        }
                    }
                )
            } catch {
                assistantMessage.content = "Error: \(error.localizedDescription)"
                assistantMessage.isStreaming = false
                isLoading = false
            }
        }
    }
    
    private func handleFileImport(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            for url in urls {
                guard url.startAccessingSecurityScopedResource() else { continue }
                defer { url.stopAccessingSecurityScopedResource() }
                
                if let data = try? Data(contentsOf: url) {
                    let attachment = Attachment(
                        filename: url.lastPathComponent,
                        mimeType: url.mimeType,
                        data: data
                    )
                    attachments.append(attachment)
                }
            }
        case .failure(let error):
            print("File import error: \(error)")
        }
    }
}

// MARK: - Supporting Views

struct LoadingIndicator: View {
    @State private var isAnimating = false
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.accentColor.opacity(0.7))
                    .frame(width: 8, height: 8)
                    .scaleEffect(isAnimating ? 1.0 : 0.5)
                    .animation(
                        .easeInOut(duration: 0.6)
                        .repeatForever()
                        .delay(Double(index) * 0.2),
                        value: isAnimating
                    )
            }
        }
        .onAppear { isAnimating = true }
    }
}

// URL extension for MIME type
extension URL {
    var mimeType: String {
        switch pathExtension.lowercased() {
        case "jpg", "jpeg": return "image/jpeg"
        case "png": return "image/png"
        case "gif": return "image/gif"
        case "pdf": return "application/pdf"
        case "txt": return "text/plain"
        case "md": return "text/markdown"
        default: return "application/octet-stream"
        }
    }
}
