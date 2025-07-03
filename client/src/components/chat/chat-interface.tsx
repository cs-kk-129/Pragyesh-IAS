import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { ChatMessage } from "@shared/schema";

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
}

export default function ChatInterface({ chatHistory }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize with chat history
  useEffect(() => {
    if (chatHistory.length > 0) {
      setMessages(chatHistory.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    }
  }, [chatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for external questions (from sample questions)
  useEffect(() => {
    const handleAskQuestion = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.question) {
        setMessage(customEvent.detail.question);
      }
    };

    window.addEventListener("ask-question", handleAskQuestion);
    return () => {
      window.removeEventListener("ask-question", handleAskQuestion);
    };
  }, []);

  // Send message mutation with enhanced AI processing
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { message });
      return res.json();
    },
    onSuccess: (newMessage: ChatMessage) => {
      // Replace the temporary message with the actual response
      setMessages((prev) => 
        prev.map(msg => 
          msg.response === "🤔 Thinking..." ? newMessage : msg
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      
      // Update temporary message with error response
      setMessages((prev) => 
        prev.map(msg => 
          msg.response === "🤔 Thinking..." 
            ? { ...msg, response: "I apologize, but I'm experiencing technical difficulties. Please try asking your question again." }
            : msg
        )
      );
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !user || sendMessageMutation.isPending) return;
    
    const userMessage = message.trim();
    
    // Add user message with temporary AI response for immediate feedback
    const tempUserMessage: ChatMessage = {
      id: Date.now(),
      userId: user.id,
      message: userMessage,
      response: "🤔 Thinking...",
      createdAt: new Date(),
    };
    
    setMessages((prev) => [...prev, tempUserMessage]);
    
    // Clear input
    setMessage("");
    
    // Send to API
    sendMessageMutation.mutate(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">Welcome to the AI Doubt Assistant</h3>
              <p className="text-muted-foreground mb-6">
                Ask any question related to UPSC preparation, and I'll provide detailed answers to help you.
              </p>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Example questions you can ask:</p>
                <ul className="space-y-1 list-disc pl-5">
                  <li>Explain the key features of the Indian Constitution</li>
                  <li>What were the major causes of the 1857 revolt?</li>
                  <li>How does the monsoon system affect Indian agriculture?</li>
                  <li>Explain the structure and functions of the NITI Aayog</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={msg.id || index} className="space-y-3">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-tl-xl rounded-tr-xl rounded-bl-xl p-3 max-w-[80%] shadow-sm">
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                {/* AI Response */}
                {msg.response && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-tr-xl rounded-tl-xl rounded-br-xl p-3 max-w-[80%] shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">AI</span>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">UPSC Assistant</span>
                        {msg.response === "🤔 Thinking..." && (
                          <Loader2 className="h-3 w-3 animate-spin ml-1" />
                        )}
                      </div>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.response}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="border-t p-4 bg-background">
        <div className="flex space-x-2">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask any UPSC-related question or search for topics..."
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              rows={2}
              disabled={sendMessageMutation.isPending}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </div>
              <div className="text-xs text-muted-foreground">
                {sendMessageMutation.isPending ? "Processing..." : "Ready"}
              </div>
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="icon"
            className="h-12 w-12 self-start"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Ask any UPSC-related questions or doubts for immediate assistance
        </p>
      </div>
    </div>
  );
}
