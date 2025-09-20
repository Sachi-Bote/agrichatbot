import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import FileUpload from "@/components/ui/file-upload";
import { CloudUpload, BarChart3, MessageSquare, Sun, Database } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSampleQuestion: (question: string) => void;
}

export default function Sidebar({ isOpen, onClose, onSampleQuestion }: SidebarProps) {
  const [selectedModel, setSelectedModel] = useState("gemma-2b-it");
  const [selectedLanguage, setSelectedLanguage] = useState("english");

  // Fetch datasets
  const { data: datasets = [] } = useQuery({
    queryKey: ["/api/datasets"],
    refetchInterval: 5000, // Refresh every 5 seconds to show upload progress
  });

  const sampleQuestions = [
    {
      title: "Production Analysis",
      description: "Calculate crop totals by region",
      question: "What is the total rice production in Punjab from 2020 to 2022?"
    },
    {
      title: "Farming Guidance", 
      description: "Get agricultural advice",
      question: "What are the best practices for wheat cultivation?"
    },
    {
      title: "Weather Information",
      description: "Get weather updates",
      question: "Show weather forecast for next week"
    }
  ];

  return (
    <>
      <aside 
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-card border-r border-border z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        data-testid="sidebar-main"
      >
        <div className="p-4 space-y-6 h-full overflow-y-auto">
          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h3>
            
            {/* File Upload */}
            <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <FileUpload />
              </CardContent>
            </Card>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger data-testid="select-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemma-2b-it">Gemma 2B-IT (Default)</SelectItem>
                  <SelectItem value="weather-model">Weather Prediction Model</SelectItem>
                  <SelectItem value="translation-model">Language Translation Model</SelectItem>
                  <SelectItem value="disease-detection">Crop Disease Detection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="telugu">Telugu</SelectItem>
                  <SelectItem value="tamil">Tamil</SelectItem>
                  <SelectItem value="bengali">Bengali</SelectItem>
                  <SelectItem value="marathi">Marathi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sample Questions */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Sample Questions
            </h3>
            <div className="space-y-2">
              {sampleQuestions.map((sample, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto bg-muted hover:bg-muted/80"
                  onClick={() => onSampleQuestion(sample.question)}
                  data-testid={`button-sample-question-${index}`}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{sample.title}</p>
                    <p className="text-xs text-muted-foreground">{sample.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Data Sources */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Data Sources
            </h3>
            <div className="space-y-2">
              {!Array.isArray(datasets) || datasets.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No datasets uploaded yet
                </div>
              ) : (
                (datasets as any[]).map((dataset: any) => (
                  <div 
                    key={dataset.id}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                    data-testid={`dataset-${dataset.id}`}
                  >
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground truncate">{dataset.name}</span>
                    </div>
                    <span 
                      className={`w-2 h-2 rounded-full ${
                        dataset.status === 'ready' ? 'bg-primary' : 
                        dataset.status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
