import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "../../../lib/utils";
import { Spinner } from "../../ui/spinner";

interface DetectionStepProps {
  onGatewayFound: (url: string) => void;
  onNoGateway: () => void;
  onSkip: () => void;
}

interface DiscoveredGateway {
  url: string;
  source: string;
  reachable: boolean;
  response_time_ms?: number;
}

export function DetectionStep({ onGatewayFound, onNoGateway, onSkip }: DetectionStepProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("Starting discovery...");
  const [discoveredGateways, setDiscoveredGateways] = useState<DiscoveredGateway[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    autoDetectGateway();
  }, []);

  const autoDetectGateway = async () => {
    setCurrentStatus("Checking environment variables...");
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setCurrentStatus("Scanning local ports...");
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setCurrentStatus("Checking config files...");
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setCurrentStatus("Searching Tailscale network...");
    
    try {
      const gateways = await invoke<DiscoveredGateway[]>("discover_gateways");
      setDiscoveredGateways(gateways);
      setIsScanning(false);
      
      // If we found any reachable gateways, use the first one
      const reachableGateway = gateways.find(g => g.reachable);
      if (reachableGateway) {
        setCurrentStatus(`Found Gateway at ${reachableGateway.source}!`);
        await new Promise(resolve => setTimeout(resolve, 800));
        onGatewayFound(reachableGateway.url);
        return;
      }
      
      // No reachable gateways found
      setCurrentStatus("No Gateway found");
      await new Promise(resolve => setTimeout(resolve, 500));
      onNoGateway();
    } catch (err) {
      console.error("Discovery error:", err);
      setCurrentStatus("Discovery failed");
      setIsScanning(false);
      await new Promise(resolve => setTimeout(resolve, 500));
      onNoGateway();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full space-y-8">
        {/* Header */}
        <div
          className={cn(
            "text-center transition-all duration-700 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className={cn(
            "inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br shadow-xl mb-6",
            isScanning 
              ? "from-blue-400 to-blue-600 shadow-blue-500/20 animate-pulse" 
              : discoveredGateways.some(g => g.reachable)
              ? "from-green-400 to-green-600 shadow-green-500/20"
              : "from-amber-400 to-amber-600 shadow-amber-500/20"
          )}>
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isScanning ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              ) : discoveredGateways.some(g => g.reachable) ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              )}
            </svg>
          </div>
          <h2 className="text-4xl font-bold mb-3">
            {isScanning ? "Looking for Gateway..." : "Discovery Complete"}
          </h2>
          <p className="text-lg text-muted-foreground">
            {isScanning 
              ? "Scanning for Clawdbot Gateway instances" 
              : discoveredGateways.some(g => g.reachable)
              ? `Found ${discoveredGateways.filter(g => g.reachable).length} Gateway${discoveredGateways.filter(g => g.reachable).length > 1 ? 's' : ''}`
              : "No Gateway found"}
          </p>
        </div>

        {/* Status card */}
        {isScanning && (
          <div
            className={cn(
              "p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-4 transition-all duration-700 delay-200 ease-out",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            <div className="flex items-center gap-3">
              <Spinner size="sm" />
              <div className="flex-1">
                <p className="font-medium text-blue-600 dark:text-blue-400">
                  Discovering...
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentStatus}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Discovered gateways list */}
        {!isScanning && discoveredGateways.length > 0 && (
          <div
            className={cn(
              "space-y-3 transition-all duration-700 delay-200 ease-out",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            {discoveredGateways.map((gateway, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-xl border transition-colors",
                  gateway.reachable
                    ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/15 cursor-pointer"
                    : "bg-muted/50 border-border opacity-50"
                )}
                onClick={() => gateway.reachable && onGatewayFound(gateway.url)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        gateway.reachable ? "bg-green-500" : "bg-muted-foreground"
                      )} />
                      <p className="font-medium truncate">{gateway.source}</p>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {gateway.url}
                    </p>
                    {gateway.response_time_ms !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Response: {gateway.response_time_ms}ms
                      </p>
                    )}
                  </div>
                  {gateway.reachable && (
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div
          className={cn(
            "text-center space-y-2 transition-all duration-700 delay-400 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {isScanning ? (
            <>
              <p className="text-sm text-muted-foreground">
                This usually takes just a few seconds
              </p>
              <button
                onClick={onSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Skip auto-detection
              </button>
            </>
          ) : !discoveredGateways.some(g => g.reachable) && (
            <p className="text-sm text-muted-foreground">
              No gateways were reachable. Try manual setup instead.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
