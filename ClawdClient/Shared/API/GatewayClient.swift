import Foundation
import Combine

/// WebSocket client for Clawdbot Gateway
@MainActor
class GatewayClient: ObservableObject {
    @Published var isConnected = false
    @Published var connectionError: String?
    
    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession?
    private var gatewayURL: URL?
    private var authToken: String?
    
    private var messageHandlers: [UUID: (GatewayMessage) -> Void] = [:]
    private var streamHandlers: [UUID: (String) -> Void] = [:]
    
    init() {}
    
    /// Connect to Clawdbot Gateway
    func connect(url: String, token: String) async throws {
        guard let gatewayURL = URL(string: url) else {
            throw GatewayError.invalidURL
        }
        
        self.gatewayURL = gatewayURL
        self.authToken = token
        
        var request = URLRequest(url: gatewayURL)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        session = URLSession(configuration: .default)
        webSocket = session?.webSocketTask(with: request)
        webSocket?.resume()
        
        isConnected = true
        connectionError = nil
        
        // Start receiving messages
        Task {
            await receiveMessages()
        }
    }
    
    /// Disconnect from Gateway
    func disconnect() {
        webSocket?.cancel(with: .normalClosure, reason: nil)
        webSocket = nil
        isConnected = false
    }
    
    /// Send a chat message and stream the response
    func sendMessage(
        content: String,
        conversationId: UUID,
        model: String?,
        thinkingEnabled: Bool,
        attachments: [Attachment] = [],
        onStream: @escaping (String) -> Void,
        onComplete: @escaping (GatewayResponse) -> Void
    ) async throws {
        guard isConnected, let webSocket = webSocket else {
            throw GatewayError.notConnected
        }
        
        let requestId = UUID()
        
        // Register stream handler
        streamHandlers[requestId] = onStream
        
        // Build request
        let request = GatewayRequest(
            id: requestId.uuidString,
            method: "chat.send",
            params: ChatParams(
                message: content,
                sessionKey: conversationId.uuidString,
                model: model,
                thinking: thinkingEnabled ? "low" : nil,
                attachments: attachments.map { att in
                    AttachmentParam(
                        filename: att.filename,
                        mimeType: att.mimeType,
                        data: att.data?.base64EncodedString()
                    )
                }
            )
        )
        
        let encoder = JSONEncoder()
        let data = try encoder.encode(request)
        let message = URLSessionWebSocketTask.Message.data(data)
        
        try await webSocket.send(message)
    }
    
    /// Receive messages from WebSocket
    private func receiveMessages() async {
        guard let webSocket = webSocket else { return }
        
        do {
            while isConnected {
                let message = try await webSocket.receive()
                
                switch message {
                case .data(let data):
                    handleMessage(data)
                case .string(let text):
                    if let data = text.data(using: .utf8) {
                        handleMessage(data)
                    }
                @unknown default:
                    break
                }
            }
        } catch {
            await MainActor.run {
                self.isConnected = false
                self.connectionError = error.localizedDescription
            }
        }
    }
    
    private func handleMessage(_ data: Data) {
        let decoder = JSONDecoder()
        
        // Try to parse as stream chunk
        if let chunk = try? decoder.decode(StreamChunk.self, from: data) {
            if let handler = streamHandlers[UUID(uuidString: chunk.requestId) ?? UUID()] {
                handler(chunk.content)
            }
            return
        }
        
        // Try to parse as complete response
        if let response = try? decoder.decode(GatewayResponse.self, from: data) {
            // Handle complete response
            print("Received response: \(response)")
        }
    }
}

// MARK: - Gateway Types

struct GatewayRequest: Codable {
    let id: String
    let method: String
    let params: ChatParams
}

struct ChatParams: Codable {
    let message: String
    let sessionKey: String
    let model: String?
    let thinking: String?
    let attachments: [AttachmentParam]?
}

struct AttachmentParam: Codable {
    let filename: String
    let mimeType: String
    let data: String?
}

struct GatewayMessage: Codable {
    let type: String
    let data: AnyCodable?
}

struct StreamChunk: Codable {
    let requestId: String
    let content: String
    let done: Bool?
}

struct GatewayResponse: Codable {
    let id: String
    let result: ResponseResult?
    let error: ResponseError?
}

struct ResponseResult: Codable {
    let content: String?
    let sources: [Source]?
    let model: String?
    let thinking: String?
}

struct ResponseError: Codable {
    let code: Int
    let message: String
}

enum GatewayError: Error, LocalizedError {
    case invalidURL
    case notConnected
    case encodingFailed
    case serverError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid gateway URL"
        case .notConnected: return "Not connected to gateway"
        case .encodingFailed: return "Failed to encode message"
        case .serverError(let msg): return msg
        }
    }
}

// Helper for dynamic JSON
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let string = try? container.decode(String.self) {
            value = string
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else {
            value = ""
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let string = value as? String {
            try container.encode(string)
        } else if let int = value as? Int {
            try container.encode(int)
        } else if let double = value as? Double {
            try container.encode(double)
        } else if let bool = value as? Bool {
            try container.encode(bool)
        }
    }
}
