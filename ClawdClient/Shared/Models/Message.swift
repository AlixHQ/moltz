import Foundation
import SwiftData

/// A single message in a conversation
@Model
final class Message {
    var id: UUID
    var conversationId: UUID
    var role: MessageRole
    var content: String
    var timestamp: Date
    var isStreaming: Bool
    var attachments: [Attachment]
    var sources: [Source]
    var thinkingContent: String?
    var modelUsed: String?
    
    init(
        id: UUID = UUID(),
        conversationId: UUID,
        role: MessageRole,
        content: String = "",
        timestamp: Date = Date(),
        isStreaming: Bool = false,
        attachments: [Attachment] = [],
        sources: [Source] = [],
        thinkingContent: String? = nil,
        modelUsed: String? = nil
    ) {
        self.id = id
        self.conversationId = conversationId
        self.role = role
        self.content = content
        self.timestamp = timestamp
        self.isStreaming = isStreaming
        self.attachments = attachments
        self.sources = sources
        self.thinkingContent = thinkingContent
        self.modelUsed = modelUsed
    }
}

enum MessageRole: String, Codable {
    case user
    case assistant
    case system
}

struct Attachment: Codable, Hashable {
    var id: UUID
    var filename: String
    var mimeType: String
    var data: Data?
    var url: String?
    
    init(id: UUID = UUID(), filename: String, mimeType: String, data: Data? = nil, url: String? = nil) {
        self.id = id
        self.filename = filename
        self.mimeType = mimeType
        self.data = data
        self.url = url
    }
}

struct Source: Codable, Hashable {
    var title: String
    var url: String?
    var snippet: String?
}
