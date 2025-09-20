import { useState } from "react";
import Sidebar from "./Sidebar";
import MessagesContainer from "./MessagesContainer";
import InputArea from "./InputArea";
import { Button } from "@/components/ui/button";
import { Menu, Settings, Sparkles } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: any;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-50 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleSidebar}
              data-testid="button-sidebar-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">AgroQA</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden sm:inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Gemma 2B-IT
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSampleQuestion={(question: string) => {
          // This will be handled by InputArea
        }}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col pt-16 md:ml-80">
        <MessagesContainer 
          messages={messages}
          isLoading={isLoading}
        />
        <InputArea 
          onSendMessage={addMessage}
          onLoadingChange={setIsLoading}
          conversationId={currentConversationId}
          onConversationIdChange={setCurrentConversationId}
        />
      </main>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          data-testid="overlay-sidebar"
        />
      )}
    </div>
  );
}
