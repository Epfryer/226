
import { useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface PdfUploaderProps {
  onUploadComplete?: () => void;
}

export function PdfUploader({ onUploadComplete }: PdfUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(".pdf", ""));
      setError(null);
    } else {
      setError("Please select a valid PDF file");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("title", title);
    formData.append("year", year);

    try {
      const response = await fetch("/api/publications/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setSuccess(true);
      setFile(null);
      setTitle("");
      
      if (onUploadComplete) {
        onUploadComplete();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle("");
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Upload PDF Publication</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="pdf-file" className="block mb-2">
            Select PDF File
          </Label>
          <Input
            id="pdf-file"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="cursor-pointer"
          />
        </div>

        {file && (
          <>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="flex-1 truncate">{file.name}</span>
              <button
                onClick={clearFile}
                disabled={uploading}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <Label htmlFor="title" className="block mb-2">
                Publication Title
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
                placeholder="Enter publication title"
              />
            </div>

            <div>
              <Label htmlFor="year" className="block mb-2">
                Year
              </Label>
              <Input
                id="year"
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={uploading}
                placeholder="2024"
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !file || !title}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF
                </>
              )}
            </Button>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
            PDF uploaded successfully!
          </div>
        )}
      </div>
    </div>
  );
}
