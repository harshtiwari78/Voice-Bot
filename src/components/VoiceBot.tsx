"use client";

import { useEffect, useState, useRef } from "react";

declare global {
  interface Window {
    vapiSDK: any;
    vapiInstance: any;
  }
}

export function VoiceBot() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Click to speak");
  const vapiInstanceRef = useRef<any>(null);

  // VAPI Configuration
  const VAPI_CONFIG = {
    apiKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
    assistant: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
  };

  // Load VAPI SDK
  useEffect(() => {
    const loadVapiSDK = () => {
      if (window.vapiSDK) {
        initializeVapi();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
      script.defer = true;
      script.async = true;

      script.onload = () => {
        console.log("✅ VAPI SDK loaded successfully");
        setIsLoaded(true);
        initializeVapi();
      };

      script.onerror = () => {
        console.error("❌ Failed to load VAPI SDK");
        setStatus("Voice SDK failed to load");
      };

      document.head.appendChild(script);
    };

    loadVapiSDK();
  }, []);

  // Initialize VAPI
  const initializeVapi = () => {
    if (!window.vapiSDK) {
      console.error("VAPI SDK not available");
      return;
    }

    try {
      console.log("🚀 Initializing VAPI...");
      
      vapiInstanceRef.current = window.vapiSDK.run({
        apiKey: VAPI_CONFIG.apiKey,
        assistant: VAPI_CONFIG.assistant,
      });

      window.vapiInstance = vapiInstanceRef.current;
      setupEventListeners();
      
      console.log("✅ VAPI initialized successfully");
      setStatus("Ready to speak");
    } catch (error) {
      console.error("❌ Error initializing VAPI:", error);
      setStatus("Voice system error");
    }
  };

  // Setup VAPI event listeners
  const setupEventListeners = () => {
    if (!vapiInstanceRef.current) return;

    const vapi = vapiInstanceRef.current;

    vapi.on("call-start", () => {
      console.log("✅ Call started");
      setIsActive(true);
      setStatus("Connected - Ready to listen");
    });

    vapi.on("call-end", () => {
      console.log("✅ Call ended");
      setIsActive(false);
      setIsListening(false);
      setStatus("Click to speak");
    });

    vapi.on("speech-start", () => {
      console.log("🎤 User started speaking");
      setIsListening(true);
      setStatus("Listening...");
    });

    vapi.on("speech-end", () => {
      console.log("🎤 User stopped speaking");
      setIsListening(false);
      setStatus("Processing...");
    });

    vapi.on("message", (message: any) => {
      console.log("📨 Message received:", message);
      
      if (message.type === "transcript" && message.role === "user") {
        const transcript = message.transcript || message.transcriptPartial;
        if (transcript && !message.transcriptPartial) {
          console.log("👤 User said:", transcript);
          processVoiceCommand(transcript);
        }
      }
    });

    vapi.on("error", (error: any) => {
      console.error("❌ VAPI Error:", error);
      setStatus("Voice error occurred");
    });
  };

  // Process voice commands for navigation
  const processVoiceCommand = (transcript: string) => {
    console.log("🎤 Processing voice command:", transcript);
    
    const command = transcript.toLowerCase();
    
    // Website navigation commands
    if (command.includes("open google") || command.includes("go to google")) {
      handleNavigation("https://www.google.com");
      return;
    }
    if (command.includes("open youtube") || command.includes("go to youtube")) {
      handleNavigation("https://www.youtube.com");
      return;
    }
    if (command.includes("open facebook") || command.includes("go to facebook")) {
      handleNavigation("https://www.facebook.com");
      return;
    }
    if (command.includes("open twitter") || command.includes("go to twitter")) {
      handleNavigation("https://www.twitter.com");
      return;
    }
    if (command.includes("open github") || command.includes("go to github")) {
      handleNavigation("https://www.github.com");
      return;
    }

    // General navigation
    const goToMatch = command.match(/(?:go to|open|navigate to|visit)\s+(?:the\s+)?(?:website\s+)?([a-z0-9\-\.]+\.[a-z]{2,})/i);
    if (goToMatch && goToMatch[1]) {
      handleNavigation("https://" + goToMatch[1]);
      return;
    }

    // Search functionality
    const searchMatch = command.match(/search\s+(?:for|about)?\s+(.+)/i);
    if (searchMatch && searchMatch[1]) {
      const searchQuery = searchMatch[1].trim();
      if (searchQuery) {
        const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(searchQuery);
        handleNavigation(searchUrl);
        return;
      }
    }

    // URL detection
    const urlMatch = transcript.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9\-\.]+\.[a-z]{2,}(?:\/\S*)?)/i);
    if (urlMatch) {
      let url = urlMatch[0];
      if (!url.startsWith("http")) {
        url = "https://" + url;
      }
      handleNavigation(url);
      return;
    }
  };

  // Handle navigation
  const handleNavigation = (url: string) => {
    try {
      console.log("🌐 Navigating to:", url);
      window.open(url, "_blank");
      
      if (vapiInstanceRef.current) {
        vapiInstanceRef.current.say("Opening the requested website for you!", false);
      }
    } catch (error) {
      console.error("❌ Navigation error:", error);
    }
  };

  // Toggle voice bot
  const toggleVoiceBot = () => {
    if (!vapiInstanceRef.current) {
      console.error("VAPI not initialized");
      return;
    }

    if (isActive) {
      vapiInstanceRef.current.stop();
    } else {
      vapiInstanceRef.current.start();
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999]"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      <div className="relative">
        {/* Voice bot button */}
        <button
          onClick={toggleVoiceBot}
          disabled={!isLoaded}
          className={`
            w-16 h-16 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center
            ${isActive
              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            }
            ${isListening ? "animate-pulse" : ""}
            ${!isLoaded ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}
          `}
          style={{
            position: 'relative',
            zIndex: 1
          }}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            {isActive ? (
              <path d="M6 6h2v12H6zm10 0h2v12h-2z"/>
            ) : (
              <path d="M12 1a11 11 0 0 0-11 11v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6a7 7 0 0 1 14 0v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6a11 11 0 0 0-11-11zm0 7a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0v-8a3 3 0 0 0-3-3z"/>
            )}
          </svg>
        </button>

        {/* Status tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          {status}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>

        {/* Listening indicator */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"></div>
        )}
      </div>
    </div>
  );
}
