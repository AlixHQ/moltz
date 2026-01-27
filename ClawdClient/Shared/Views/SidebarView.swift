import SwiftUI
import SwiftData

/// Sidebar with conversation list
struct SidebarView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Conversation.updatedAt, order: .reverse) private var conversations: [Conversation]
    
    @Binding var selectedConversation: Conversation?
    @State private var searchText = ""
    
    var body: some View {
        VStack(spacing: 0) {
            // New chat button
            Button(action: createNewConversation) {
                Label("New Chat", systemImage: "plus.message")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .padding()
            
            // Search
            TextField("Search conversations...", text: $searchText)
                .textFieldStyle(.roundedBorder)
                .padding(.horizontal)
                .padding(.bottom, 8)
            
            // Conversation list
            List(selection: $selectedConversation) {
                // Pinned section
                let pinned = filteredConversations.filter { $0.isPinned }
                if !pinned.isEmpty {
                    Section("Pinned") {
                        ForEach(pinned) { conversation in
                            ConversationRow(conversation: conversation)
                                .tag(conversation)
                                .contextMenu {
                                    ConversationContextMenu(conversation: conversation)
                                }
                        }
                    }
                }
                
                // Today
                let today = filteredConversations.filter { 
                    !$0.isPinned && Calendar.current.isDateInToday($0.updatedAt)
                }
                if !today.isEmpty {
                    Section("Today") {
                        ForEach(today) { conversation in
                            ConversationRow(conversation: conversation)
                                .tag(conversation)
                                .contextMenu {
                                    ConversationContextMenu(conversation: conversation)
                                }
                        }
                    }
                }
                
                // Yesterday
                let yesterday = filteredConversations.filter {
                    !$0.isPinned && Calendar.current.isDateInYesterday($0.updatedAt)
                }
                if !yesterday.isEmpty {
                    Section("Yesterday") {
                        ForEach(yesterday) { conversation in
                            ConversationRow(conversation: conversation)
                                .tag(conversation)
                                .contextMenu {
                                    ConversationContextMenu(conversation: conversation)
                                }
                        }
                    }
                }
                
                // Older
                let older = filteredConversations.filter {
                    !$0.isPinned && 
                    !Calendar.current.isDateInToday($0.updatedAt) &&
                    !Calendar.current.isDateInYesterday($0.updatedAt)
                }
                if !older.isEmpty {
                    Section("Previous") {
                        ForEach(older) { conversation in
                            ConversationRow(conversation: conversation)
                                .tag(conversation)
                                .contextMenu {
                                    ConversationContextMenu(conversation: conversation)
                                }
                        }
                    }
                }
            }
            .listStyle(.sidebar)
        }
        #if os(macOS)
        .frame(minWidth: 250)
        #endif
    }
    
    private var filteredConversations: [Conversation] {
        if searchText.isEmpty {
            return conversations
        }
        return conversations.filter {
            $0.title.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    private func createNewConversation() {
        let conversation = Conversation()
        modelContext.insert(conversation)
        selectedConversation = conversation
    }
}

/// Single conversation row in sidebar
struct ConversationRow: View {
    @Bindable var conversation: Conversation
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(conversation.title)
                    .lineLimit(1)
                    .font(.body)
                
                Text(conversation.updatedAt, style: .relative)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            if conversation.isPinned {
                Image(systemName: "pin.fill")
                    .font(.caption)
                    .foregroundStyle(.orange)
            }
        }
        .padding(.vertical, 4)
    }
}

/// Context menu for conversation actions
struct ConversationContextMenu: View {
    @Environment(\.modelContext) private var modelContext
    @Bindable var conversation: Conversation
    @State private var isRenaming = false
    @State private var newTitle = ""
    
    var body: some View {
        Button {
            conversation.isPinned.toggle()
        } label: {
            Label(
                conversation.isPinned ? "Unpin" : "Pin",
                systemImage: conversation.isPinned ? "pin.slash" : "pin"
            )
        }
        
        Button {
            newTitle = conversation.title
            isRenaming = true
        } label: {
            Label("Rename", systemImage: "pencil")
        }
        
        Divider()
        
        Button(role: .destructive) {
            modelContext.delete(conversation)
        } label: {
            Label("Delete", systemImage: "trash")
        }
    }
}
