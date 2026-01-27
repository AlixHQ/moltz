import SwiftUI
import SwiftData

@main
struct ClawdClientApp: App {
    @StateObject private var gateway = GatewayClient()
    @State private var selectedConversation: Conversation?
    @State private var showingSettings = false
    @AppStorage("sidebarVisible") private var sidebarVisible = true
    
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            Conversation.self,
            Message.self,
            AppSettings.self,
        ])
        let modelConfiguration = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false,
            allowsSave: true
        )
        
        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()
    
    var body: some Scene {
        WindowGroup {
            ContentView(
                selectedConversation: $selectedConversation,
                sidebarVisible: $sidebarVisible
            )
            .environmentObject(gateway)
            .sheet(isPresented: $showingSettings) {
                SettingsView(settings: getOrCreateSettings())
            }
            .task {
                await connectToGateway()
            }
        }
        .modelContainer(sharedModelContainer)
        #if os(macOS)
        .windowStyle(.hiddenTitleBar)
        .windowToolbarStyle(.unified(showsTitle: true))
        .commands {
            SidebarCommands()
            
            CommandGroup(replacing: .newItem) {
                Button("New Chat") {
                    createNewConversation()
                }
                .keyboardShortcut("n", modifiers: [.command])
            }
            
            CommandGroup(after: .appSettings) {
                Button("Settings...") {
                    showingSettings = true
                }
                .keyboardShortcut(",", modifiers: [.command])
            }
            
            CommandGroup(replacing: .sidebar) {
                Button(sidebarVisible ? "Hide Sidebar" : "Show Sidebar") {
                    withAnimation {
                        sidebarVisible.toggle()
                    }
                }
                .keyboardShortcut("s", modifiers: [.command, .control])
            }
        }
        #endif
        
        #if os(macOS)
        Settings {
            SettingsView(settings: getOrCreateSettings())
        }
        #endif
    }
    
    private func connectToGateway() async {
        // TODO: Load from settings
        let url = "ws://localhost:18789"
        let token = ""
        
        do {
            try await gateway.connect(url: url, token: token)
        } catch {
            print("Failed to connect: \(error)")
        }
    }
    
    @MainActor
    private func createNewConversation() {
        let conversation = Conversation()
        sharedModelContainer.mainContext.insert(conversation)
        selectedConversation = conversation
    }
    
    @MainActor
    private func getOrCreateSettings() -> AppSettings {
        let context = sharedModelContainer.mainContext
        let descriptor = FetchDescriptor<AppSettings>()
        
        if let existing = try? context.fetch(descriptor).first {
            return existing
        }
        
        let settings = AppSettings()
        context.insert(settings)
        return settings
    }
}

/// Main content view with sidebar and chat
struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject var gateway: GatewayClient
    
    @Binding var selectedConversation: Conversation?
    @Binding var sidebarVisible: Bool
    
    var body: some View {
        NavigationSplitView(columnVisibility: .constant(sidebarVisible ? .all : .detailOnly)) {
            SidebarView(selectedConversation: $selectedConversation)
        } detail: {
            if let conversation = selectedConversation {
                ChatView(conversation: conversation)
            } else {
                WelcomeView(onNewChat: createNewConversation)
            }
        }
        .toolbar {
            #if os(macOS)
            ToolbarItem(placement: .navigation) {
                Button {
                    withAnimation {
                        sidebarVisible.toggle()
                    }
                } label: {
                    Image(systemName: "sidebar.leading")
                }
                .help(sidebarVisible ? "Hide Sidebar" : "Show Sidebar")
            }
            #endif
            
            ToolbarItem(placement: .primaryAction) {
                Button(action: createNewConversation) {
                    Image(systemName: "square.and.pencil")
                }
                .help("New Chat")
            }
            
            ToolbarItem {
                ConnectionStatus(isConnected: gateway.isConnected)
            }
        }
    }
    
    private func createNewConversation() {
        let conversation = Conversation()
        modelContext.insert(conversation)
        selectedConversation = conversation
    }
}

/// Welcome view when no conversation is selected
struct WelcomeView: View {
    let onNewChat: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "sparkles")
                .font(.system(size: 64))
                .foregroundStyle(.orange.gradient)
            
            Text("Welcome to Clawd")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Your AI assistant powered by Clawdbot")
                .font(.title3)
                .foregroundStyle(.secondary)
            
            Button(action: onNewChat) {
                Label("Start New Chat", systemImage: "plus.message")
                    .font(.headline)
                    .padding()
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding()
    }
}

/// Connection status indicator
struct ConnectionStatus: View {
    let isConnected: Bool
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(isConnected ? .green : .red)
                .frame(width: 8, height: 8)
            
            Text(isConnected ? "Connected" : "Disconnected")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
