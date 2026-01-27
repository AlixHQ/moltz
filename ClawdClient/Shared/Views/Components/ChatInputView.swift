import SwiftUI

/// Chat input area with text field, attachments preview, and send button
struct ChatInputView: View {
    @Binding var text: String
    @Binding var attachments: [Attachment]
    let isLoading: Bool
    let onSend: () -> Void
    let onAttach: () -> Void
    
    @State private var isRecordingVoice = false
    @FocusState private var isFocused: Bool
    
    var body: some View {
        VStack(spacing: 8) {
            // Attachments preview
            if !attachments.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(attachments, id: \.id) { attachment in
                            AttachmentChip(
                                attachment: attachment,
                                onRemove: { removeAttachment(attachment) }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
            }
            
            // Input row
            HStack(alignment: .bottom, spacing: 12) {
                // Attach button
                Button(action: onAttach) {
                    Image(systemName: "paperclip")
                        .font(.title2)
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .help("Attach files")
                
                // Voice button
                Button(action: toggleVoiceRecording) {
                    Image(systemName: isRecordingVoice ? "stop.circle.fill" : "mic.circle")
                        .font(.title2)
                        .foregroundStyle(isRecordingVoice ? .red : .secondary)
                }
                .buttonStyle(.plain)
                .help("Voice message")
                
                // Text input
                #if os(macOS)
                TextEditor(text: $text)
                    .font(.body)
                    .frame(minHeight: 36, maxHeight: 120)
                    .scrollContentBackground(.hidden)
                    .padding(8)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(12)
                    .focused($isFocused)
                    .onSubmit {
                        if NSEvent.modifierFlags.contains(.shift) == false {
                            onSend()
                        }
                    }
                #else
                TextField("Message...", text: $text, axis: .vertical)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(12)
                    .focused($isFocused)
                    .lineLimit(1...6)
                #endif
                
                // Send button
                Button(action: onSend) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title)
                        .foregroundStyle(canSend ? Color.accentColor : Color.secondary)
                }
                .buttonStyle(.plain)
                .disabled(!canSend)
                .keyboardShortcut(.return, modifiers: [])
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
        }
        .background(.ultraThinMaterial)
    }
    
    private var canSend: Bool {
        !isLoading && (!text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !attachments.isEmpty)
    }
    
    private func removeAttachment(_ attachment: Attachment) {
        attachments.removeAll { $0.id == attachment.id }
    }
    
    private func toggleVoiceRecording() {
        isRecordingVoice.toggle()
        // TODO: Implement voice recording
    }
}

/// Attachment chip in input area
struct AttachmentChip: View {
    let attachment: Attachment
    let onRemove: () -> Void
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: iconName)
                .font(.caption)
            
            Text(attachment.filename)
                .font(.caption)
                .lineLimit(1)
            
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.secondary.opacity(0.15))
        .cornerRadius(12)
    }
    
    private var iconName: String {
        if attachment.mimeType.hasPrefix("image/") {
            return "photo"
        } else if attachment.mimeType == "application/pdf" {
            return "doc.fill"
        } else {
            return "doc.text.fill"
        }
    }
}
