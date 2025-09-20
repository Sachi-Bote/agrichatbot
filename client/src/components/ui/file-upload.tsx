import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./button";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, X, FileText, File, Image } from "lucide-react";

export default function FileUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const successCount = data.results.filter((r: any) => r.status === 'ready').length;
      const errorCount = data.results.filter((r: any) => r.status === 'error').length;
      
      toast({
        title: "Upload Complete",
        description: `${successCount} files processed successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/datasets'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const allowedTypes = ['.csv', '.pdf', '.txt', '.jpg', '.jpeg', '.png'];
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Only CSV, PDF, TXT, JPG, and PNG files are allowed",
        variant: "destructive",
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'pdf':
        return <File className="h-4 w-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
        data-testid="file-upload-dropzone"
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".csv,.pdf,.txt,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-file-upload"
        />
        
        <CloudUpload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-foreground">Upload Documents</p>
        <p className="text-xs text-muted-foreground">CSV, PDF, Images, Text</p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Files:</p>
          {selectedFiles.map((file, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded text-sm"
              data-testid={`file-selected-${index}`}
            >
              <div className="flex items-center space-x-2">
                {getFileIcon(file.name)}
                <span className="truncate">{file.name}</span>
                <span className="text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0"
                data-testid={`button-remove-file-${index}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="w-full"
            data-testid="button-upload-files"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload Files"}
          </Button>
        </div>
      )}
    </div>
  );
}
