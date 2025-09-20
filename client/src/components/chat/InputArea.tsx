import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, Calculator, Lightbulb, CloudSun } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "./ChatInterface";

interface InputAreaProps {
  onSendMessage: (message: Message) => void;
  onLoadingChange: (loading: boolean) => void;
  conversationId: string | null;
  onConversationIdChange: (id: string) => void;
}

export default function InputArea({ 
  onSendMessage, 
  onLoadingChange, 
  conversationId,
  onConversationIdChange 
}: InputAreaProps) {
  const [input, setInput] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; conversationId?: string }) => {
      const response = await apiRequest("POST", "/api/chat", data);
      return response.json();
    },
    onMutate: () => {
      onLoadingChange(true);
    },
    onSuccess: (data) => {
      // Update conversation ID if it's a new conversation
      if (!conversationId && data.conversationId) {
        onConversationIdChange(data.conversationId);
      }

      // Add assistant message
      onSendMessage({
        id: Date.now().toString() + "-assistant",
        role: "assistant",
        content: data.answer,
        metadata: {
          sources: data.sources,
          isComputation: data.isComputation,
          ...data.metadata
        },
        timestamp: new Date()
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
    onSettled: () => {
      onLoadingChange(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = input.trim();
    if (!message) return;

    // Add user message immediately
    onSendMessage({
      id: Date.now().toString() + "-user",
      role: "user",
      content: message,
      timestamp: new Date()
    });

    // Send to API
    sendMessageMutation.mutate({
      message,
      conversationId: conversationId || undefined
    });

    // Clear input
    setInput("");
    setTokenCount(0);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // Simple token estimation (rough approximation)
    setTokenCount(Math.ceil(value.length / 4));
  };

  const insertSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setTokenCount(Math.ceil(suggestion.length / 4));
  };

  const suggestions = [
    {
      icon: Calculator,
      label: "Calculate Production",
      query: "Calculate total wheat production in Punjab"
    },
    {
      icon: Lightbulb,
      label: "Farming Tips", 
      query: "Best practices for monsoon farming"
    },
    {
      icon: CloudSun,
      label: "Weather Info",
      query: "Weather forecast for crop planning"
    }
  ];

  return (
    <div className="border-t border-border bg-card p-4" data-testid="input-area">
      {/* Query Suggestions */}
      <div className="mb-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-3 text-xs bg-muted hover:bg-muted/80"
            onClick={() => insertSuggestion(suggestion.query)}
            data-testid={`button-suggestion-${index}`}
          >
            <suggestion.icon className="h-3 w-3 mr-1" />
            {suggestion.label}
          </Button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Ask about crops, weather, farming practices, or request calculations..."
            className="min-h-[48px] max-h-32 pr-12 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            data-testid="textarea-message-input"
          />
          
          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            data-testid="button-attachment"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        
        <Button 
          type="submit"
          disabled={!input.trim() || sendMessageMutation.isPending}
          className="px-6 py-3"
          data-testid="button-send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>🟢 Vector Index: Ready</span>
          <span>📊 Data Sources: Connected</span>
          <span>🌐 API: Connected</span>
        </div>
        <div>
          <span data-testid="text-token-count">{tokenCount}</span>/4096 tokens
        </div>
      </div>
    </div>
  );
}
