import { useStore } from "../stores/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "../lib/utils";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";

export function WelcomeView() {
  // PERF: Use selective subscriptions with shallow equality to prevent unnecessary re-renders
  const {
    createConversation,
    selectConversation,
    addMessage,
    connected,
    conversations,
  } = useStore(
    useShallow((state) => ({
      createConversation: state.createConversation,
      selectConversation: state.selectConversation,
      addMessage: state.addMessage,
      connected: state.connected,
      conversations: state.conversations,
    })),
  );

  // Get the most recent conversation with messages (for "Continue" card)
  const recentConversation = conversations.find(c => c.messages.length > 0);

  // Moltz-specific suggestions showcasing agentic capabilities
  // Titles kept short to fit in cards without truncation
  const suggestions = [
    {
      icon: "📅",
      title: "Check my calendar",
      description: "Today's schedule & meetings",
      prompt: "What's on my calendar today? Summarize any upcoming meetings.",
    },
    {
      icon: "📧",
      title: "Scan my inbox",
      description: "What needs attention?",
      prompt:
        "Check my unread emails and summarize anything important or urgent.",
    },
    {
      icon: "🎙️",
      title: "Last meeting recap",
      description: "Notes & action items",
      prompt:
        "What did we discuss in my most recent meeting? Any action items for me?",
    },
    {
      icon: "💬",
      title: "Send a message",
      description: "Slack, email, or chat",
      prompt: "Help me send a message. Who should I contact?",
    },
    {
      icon: "🔍",
      title: "Find a file",
      description: "Search your documents",
      prompt: "Help me find a file. What are you looking for?",
    },
    {
      icon: "🏠",
      title: "Smart home",
      description: "Lights, thermostat & more",
      prompt:
        "What smart home devices can I control? Show me what's available.",
    },
  ];

  const handleSuggestionClick = async (suggestion: (typeof suggestions)[0]) => {
    const conv = createConversation();
    selectConversation(conv.id);
    // Auto-send the suggestion prompt
    addMessage(conv.id, {
      role: "user",
      content: suggestion.prompt,
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 select-none">
      <div className="max-w-3xl w-full text-center">
        {/* Semantic heading for screen readers */}
        <h1 className="sr-only">Moltz AI Assistant - Welcome</h1>

        {/* Logo */}
        <div className="mb-8 animate-in zoom-in-50 duration-500">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 shadow-xl shadow-orange-500/20 mb-6 transform hover:scale-105 transition-transform">
            <span
              className="text-5xl drop-shadow-lg"
              role="img"
              aria-label="Moltz lobster mascot"
            >
              🦞
            </span>
          </div>
          <h2
            className="text-5xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-3"
            aria-hidden="true"
          >
            Moltz
          </h2>
          <p className="text-lg text-muted-foreground">
            Your AI that actually{" "}
            <span className="font-medium text-foreground">does things</span>
          </p>
        </div>

        {/* Connection status notice */}
        {!connected && (
          <div className="mb-8 px-4 py-3 bg-muted/40 border border-border/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <span className="text-sm">Waiting for Gateway connection</span>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-2 text-center">
              Open Settings <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded font-mono">⌘,</kbd> to connect
            </p>
          </div>
        )}

        {/* Model info - removed for cleaner UI */}

        {/* Continue conversation card */}
        {recentConversation && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={() => selectConversation(recentConversation.id)}
              disabled={!connected}
              className={cn(
                "w-full max-w-md mx-auto p-4 text-left rounded-xl border-2 transition-all duration-200",
                connected
                  ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 cursor-pointer"
                  : "border-border/50 opacity-50 cursor-not-allowed",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary">Continue your conversation</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {recentConversation.messages.find(m => m.role === "user")?.content.slice(0, 50) || "Chat with Clawd"} 
                    {" · "}
                    {formatDistanceToNow(new Date(recentConversation.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Suggestions */}
        <div className="mb-8">
          <h3 className="sr-only">Suggested actions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {recentConversation ? "Or try something new..." : "Try asking me to..."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={!connected}
                className={cn(
                  "group p-4 text-left rounded-xl border transition-[colors,transform,box-shadow] duration-200",
                  "animate-in fade-in slide-in-from-bottom-2",
                  connected
                    ? "border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer"
                    : "border-border/50 opacity-50 cursor-not-allowed",
                )}
                style={{ animationDelay: `${i * 50 + 200}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {suggestion.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                      {suggestion.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* New chat button */}
        <Button
          onClick={() => {
            const conv = createConversation();
            selectConversation(conv.id);
          }}
          disabled={!connected}
          variant="primary"
          size="lg"
          leftIcon={<Plus className="w-5 h-5" />}
          className={cn(
            "animate-in fade-in zoom-in-95 duration-500",
            connected &&
              "hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0",
          )}
          style={{ animationDelay: "400ms" }}
        >
          Start New Chat
        </Button>

        {/* Keyboard hints removed for cleaner UI */}
      </div>
    </div>
  );
}
