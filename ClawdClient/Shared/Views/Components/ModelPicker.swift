import SwiftUI

/// Model selection picker
struct ModelPicker: View {
    @Binding var selectedModel: String?
    
    var body: some View {
        Menu {
            Button {
                selectedModel = nil
            } label: {
                HStack {
                    Text("Auto")
                    if selectedModel == nil {
                        Image(systemName: "checkmark")
                    }
                }
            }
            
            Divider()
            
            ForEach(ModelOption.defaults) { model in
                Button {
                    selectedModel = model.id
                } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(model.name)
                            Text(model.provider)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        
                        Spacer()
                        
                        if selectedModel == model.id {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "cpu")
                Text(displayName)
                    .lineLimit(1)
            }
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.secondary.opacity(0.15))
            .cornerRadius(8)
        }
    }
    
    private var displayName: String {
        guard let id = selectedModel else { return "Auto" }
        return ModelOption.defaults.first { $0.id == id }?.name ?? "Auto"
    }
}

/// Settings sheet
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Bindable var settings: AppSettings
    
    @State private var gatewayURL = ""
    @State private var gatewayToken = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Connection") {
                    TextField("Gateway URL", text: $gatewayURL)
                        .textContentType(.URL)
                    
                    SecureField("Auth Token", text: $gatewayToken)
                }
                
                Section("Appearance") {
                    Picker("Theme", selection: $settings.appearance) {
                        ForEach(AppAppearance.allCases, id: \.self) { appearance in
                            Text(appearance.displayName).tag(appearance)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                
                Section("Defaults") {
                    Picker("Default Model", selection: $settings.selectedModel) {
                        Text("Auto").tag("auto")
                        ForEach(ModelOption.defaults) { model in
                            Text(model.name).tag(model.id)
                        }
                    }
                    
                    Toggle("Thinking Mode", isOn: $settings.thinkingModeDefault)
                }
                
                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                    
                    Link(destination: URL(string: "https://docs.clawd.bot")!) {
                        Label("Documentation", systemImage: "book")
                    }
                    
                    Link(destination: URL(string: "https://github.com/dokterdok/clawd-client")!) {
                        Label("GitHub", systemImage: "chevron.left.forwardslash.chevron.right")
                    }
                }
            }
            .navigationTitle("Settings")
            #if os(macOS)
            .frame(width: 400, height: 400)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
