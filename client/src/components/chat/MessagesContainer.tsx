import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, User, Download, BarChart3, Loader2 } from "lucide-react";
import type { Message } from "./ChatInterface";

interface MessagesContainerProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessagesContainer({ messages, isLoading }: MessagesContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-container">
      {/* Welcome Message */}
      {messages.length === 0 && !isLoading && (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <Card className="max-w-2xl">
            <CardContent className="p-4">
              <p className="text-foreground mb-2">
                Welcome to AgroQA! I'm your agricultural AI assistant powered by Gemma 2B-IT and RAG technology. I can help you with:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Agricultural data analysis and calculations</li>
                <li>• Crop production statistics</li>
                <li>• Farming best practices and guidance</li>
                <li>• Weather information and forecasts</li>
                <li>• Multi-language support for farmers</li>
              </ul>
              <p className="mt-3 text-foreground">How can I assist you today?</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <div 
          key={message.id}
          className={`flex items-start space-x-3 ${
            message.role === 'user' ? 'justify-end' : ''
          }`}
          data-testid={`message-${message.role}-${message.id}`}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          
          <Card className={`max-w-2xl ${
            message.role === 'user' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card border border-border'
          }`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className={message.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}>
                  {message.content}
                </p>

                {/* Computation Results */}
                {message.metadata?.isComputation && (
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    <pre className="whitespace-pre-wrap text-foreground">
                      {message.content}
                    </pre>
                  </div>
                )}

                {/* Additional Context */}
                {message.metadata?.sources && message.metadata.sources.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Data Sources:</strong> {message.metadata.sources.join(', ')}</p>
                    {message.metadata.isComputation && (
                      <p><strong>Query Type:</strong> Computational analysis with vector retrieval</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {message.role === 'assistant' && message.metadata?.isComputation && (
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="secondary" data-testid="button-export-data">
                      <Download className="h-3 w-3 mr-1" />
                      Export Data
                    </Button>
                    <Button size="sm" variant="secondary" data-testid="button-visualize">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Visualize
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {message.role === 'user' && (
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-secondary-foreground" />
            </div>
          )}
        </div>
      ))}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-muted-foreground">Processing your query...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
