import Foundation
import SwiftData

/// A conversation/chat session
@Model
final class Conversation {
    var id: UUID
    var title: String
    var createdAt: Date
    var updatedAt: Date
    var model: String?
    var thinkingEnabled: Bool
    var isPinned: Bool
    
    @Relationship(deleteRule: .cascade, inverse: \Message.conversationId)
    var messages: [Message]?
    
    init(
        id: UUID = UUID(),
        title: String = "New Chat",
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        model: String? = nil,
        thinkingEnabled: Bool = false,
        isPinned: Bool = false
    ) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.model = model
        self.thinkingEnabled = thinkingEnabled
        self.isPinned = isPinned
    }
    
    /// Auto-generate title from first user message
    func generateTitle(from content: String) {
        let words = content.components(separatedBy: .whitespacesAndNewlines)
        let preview = words.prefix(6).joined(separator: " ")
        self.title = preview.count > 40 ? String(preview.prefix(40)) + "..." : preview
    }
}

/// Available models
struct ModelOption: Identifiable, Hashable {
    var id: String
    var name: String
    var provider: String
    var supportsThinking: Bool
    var supportsVision: Bool
    
    static let defaults: [ModelOption] = [
        ModelOption(id: "anthropic/claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "Anthropic", supportsThinking: true, supportsVision: true),
        ModelOption(id: "anthropic/claude-opus-4-5", name: "Claude Opus 4.5", provider: "Anthropic", supportsThinking: true, supportsVision: true),
        ModelOption(id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", supportsThinking: false, supportsVision: true),
        ModelOption(id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", supportsThinking: true, supportsVision: true),
    ]
}

/// App settings
@Model
final class AppSettings {
    var selectedModel: String
    var thinkingModeDefault: Bool
    var appearance: AppAppearance
    var sidebarVisible: Bool
    
    init(
        selectedModel: String = "anthropic/claude-sonnet-4-5",
        thinkingModeDefault: Bool = false,
        appearance: AppAppearance = .system,
        sidebarVisible: Bool = true
    ) {
        self.selectedModel = selectedModel
        self.thinkingModeDefault = thinkingModeDefault
        self.appearance = appearance
        self.sidebarVisible = sidebarVisible
    }
}

enum AppAppearance: String, Codable, CaseIterable {
    case light
    case dark
    case system
    
    var displayName: String {
        switch self {
        case .light: return "Light"
        case .dark: return "Dark"
        case .system: return "Auto"
        }
    }
}
