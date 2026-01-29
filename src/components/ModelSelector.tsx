import { useState, useRef, useEffect } from "react";
import { useStore, ModelInfo } from "../stores/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "../lib/utils";
import { ChevronDown, Check, Cpu, Sparkles, Zap } from "lucide-react";

interface ModelSelectorProps {
  compact?: boolean;
}

export function ModelSelector({ compact = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    availableModels,
    settings,
    currentConversationId,
    conversations,
    updateConversation,
  } = useStore(
    useShallow((state) => ({
      availableModels: state.availableModels,
      settings: state.settings,
      currentConversationId: state.currentConversationId,
      conversations: state.conversations,
      updateConversation: state.updateConversation,
    }))
  );

  const currentConversation = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)
    : null;

  const activeModelId = currentConversation?.model || settings.defaultModel;
  const activeModel = availableModels.find((m) => m.id === activeModelId);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSelectModel = (modelId: string) => {
    if (currentConversation) {
      updateConversation(currentConversation.id, { model: modelId });
    }
    setOpen(false);
  };

  // Don't render if no models available
  if (availableModels.length === 0) {
    return null;
  }

  const getModelIcon = (model: ModelInfo) => {
    const name = model.name.toLowerCase();
    if (name.includes("opus") || name.includes("gpt-4")) {
      return <Sparkles className="w-3.5 h-3.5" />;
    }
    if (name.includes("flash") || name.includes("haiku")) {
      return <Zap className="w-3.5 h-3.5" />;
    }
    return <Cpu className="w-3.5 h-3.5" />;
  };

  const getShortName = (model: ModelInfo) => {
    // Extract just the model name part
    const parts = model.id.split("/");
    const name = parts[parts.length - 1];
    // Shorten common names
    return name
      .replace("claude-", "")
      .replace("gpt-", "GPT-")
      .replace("-latest", "")
      .replace("-20250514", "");
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-md transition-colors",
          "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50",
          compact ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current model: ${activeModel?.name || "Unknown"}`}
      >
        {activeModel && getModelIcon(activeModel)}
        <span className="font-medium truncate max-w-[120px]">
          {activeModel ? getShortName(activeModel) : "Select model"}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown menu */}
          <div
            ref={menuRef}
            className={cn(
              "absolute top-full mt-1 z-50 min-w-[200px] max-w-[280px]",
              "bg-popover border border-border rounded-lg shadow-lg",
              "animate-in fade-in slide-in-from-top-2 duration-150",
              "right-0" // Align to right edge
            )}
            role="listbox"
            aria-label="Select model"
          >
            <div className="p-1 max-h-[300px] overflow-y-auto">
              {availableModels.map((model) => {
                const isActive = model.id === activeModelId;
                const isDefault = model.id === settings.defaultModel;

                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span
                      className={cn(
                        "flex-shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {getModelIcon(model)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-1.5">
                        {model.name}
                        {isDefault && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                            default
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {model.provider}
                      </div>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
