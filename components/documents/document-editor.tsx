"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Save,
  History,
  ChevronDown,
  Upload,
  Tag,
  Trash,
} from "lucide-react";
import { Document, DocumentVersion, Tag as TagType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateTime } from "@/lib/utils";
import MarkdownPreview from "./markdown-preview";
import { useDropzone } from "react-dropzone";

interface ExtendedDocument extends Document {
  tags?: Array<{
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
  versions?: DocumentVersion[];
}

interface DocumentEditorProps {
  initialDocument: ExtendedDocument;
  isNew?: boolean;
  readOnly?: boolean;
}

export default function DocumentEditor({
  initialDocument,
  isNew = false,
  readOnly = false,
}: DocumentEditorProps) {
  const [document, setDocument] = useState<ExtendedDocument>(initialDocument);
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [saving, setSaving] = useState<boolean>(false);
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [showTagsDialog, setShowTagsDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false);
  const [showPdfUploader, setShowPdfUploader] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Auto-save functionality
  useEffect(() => {
    if (!document.id || isNew || readOnly) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(false);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [document.title, document.content]);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (response.ok) {
          const tags = await response.json();
          setAvailableTags(tags);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, []);

  const handleSave = async (showToast = true) => {
    if (readOnly) return;

    setSaving(true);
    try {
      let response;

      if (isNew || !document.id) {
        // Create new document
        response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: document.title,
            content: document.content,
          }),
        });
      } else {
        // Update existing document
        response = await fetch(`/api/documents/${document.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: document.title,
            content: document.content,
          }),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save document");
      }

      const savedDocument = await response.json();
      
      if (isNew) {
        router.push(`/documents/${savedDocument.id}`);
      } else {
        setDocument(savedDocument);
        if (showToast) {
          toast.success("Document saved successfully");
        }
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (readOnly || !document.id) return;

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPublic: !document.isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visibility");
      }

      const updatedDocument = await response.json();
      setDocument(updatedDocument);
      toast.success(
        `Document is now ${updatedDocument.isPublic ? "public" : "private"}`
      );
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    }
  };

  const handleDelete = async () => {
    if (!document.id) return;

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document deleted successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const addTag = async (tagId: string) => {
    if (!document.id) return;

    try {
      const response = await fetch(`/api/documents/${document.id}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add tag");
      }

      const updatedDocument = await response.json();
      setDocument(updatedDocument);
      toast.success("Tag added successfully");
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const removeTag = async (tagId: string) => {
    if (!document.id) return;

    try {
      const response = await fetch(
        `/api/documents/${document.id}/tags/${tagId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove tag");
      }

      const updatedDocument = await response.json();
      setDocument(updatedDocument);
      toast.success("Tag removed successfully");
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  // PDF upload functionality
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (!document.id || acceptedFiles.length === 0) return;
      
      setUploadingPdf(true);
      
      try {
        const file = acceptedFiles[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentId", document.id);
        
        const response = await fetch("/api/upload/pdf", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload PDF");
        }
        
        const data = await response.json();
        toast.success("PDF processed successfully");
        setShowPdfUploader(false);
        
        // Update document content with extracted text
        setDocument({
          ...document,
          content: document.content + "\n\n## Extracted from PDF\n\n" + data.pdfData.extractedText,
        });
        
        // Save the updated content
        setTimeout(() => handleSave(), 500);
      } catch (error) {
        console.error("Error uploading PDF:", error);
        toast.error("Failed to upload PDF");
      } finally {
        setUploadingPdf(false);
      }
    },
  });

  // Restore a previous version
  const restoreVersion = (version: DocumentVersion) => {
    setDocument({
      ...document,
      content: version.content,
    });
    setShowVersionHistory(false);
    toast.success("Version restored");
  };

  if (readOnly) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{document.title}</h1>
          <div className="flex items-center space-x-2">
            <Badge variant={document.isPublic ? "default" : "secondary"}>
              {document.isPublic ? (
                <>
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Public
                </>
              ) : (
                <>
                  <EyeOff className="mr-1 h-3.5 w-3.5" />
                  Private
                </>
              )}
            </Badge>
          </div>
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {document.tags.map((tag) => (
              <Badge 
                key={tag.tag.id} 
                style={{ 
                  backgroundColor: tag.tag.color || undefined,
                  color: tag.tag.color ? 'white' : undefined 
                }}
              >
                {tag.tag.name}
              </Badge>
            ))}
          </div>
        )}

        <Card className="p-6">
          <MarkdownPreview content={document.content} />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-auto">
          <Input
            value={document.title}
            onChange={(e) =>
              setDocument({ ...document, title: e.target.value })
            }
            className="text-2xl font-bold p-2 h-auto border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Document Title"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTagsDialog(true)}
          >
            <Tag className="mr-2 h-4 w-4" />
            Manage Tags
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPdfUploader(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import PDF
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleVisibility}
          >
            {document.isPublic ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Make Private
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Make Public
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <History className="mr-2 h-4 w-4" />
                History
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                View Version History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            variant="default"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this document
                  and all of its contents.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {document.tags && document.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {document.tags.map((tag) => (
            <Badge 
              key={tag.tag.id} 
              style={{ 
                backgroundColor: tag.tag.color || undefined,
                color: tag.tag.color ? 'white' : undefined 
              }}
            >
              {tag.tag.name}
            </Badge>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="split">Split View</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <Card>
            <Textarea
              value={document.content}
              onChange={(e) =>
                setDocument({ ...document, content: e.target.value })
              }
              placeholder="Start writing here..."
              className="min-h-[60vh] resize-none p-4 font-mono text-sm border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card className="min-h-[60vh] p-6">
            <MarkdownPreview content={document.content} />
          </Card>
        </TabsContent>

        <TabsContent value="split" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <Textarea
                value={document.content}
                onChange={(e) =>
                  setDocument({ ...document, content: e.target.value })
                }
                placeholder="Start writing here..."
                className="min-h-[60vh] resize-none p-4 font-mono text-sm border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </Card>
            <Card className="min-h-[60vh] p-6 overflow-auto">
              <MarkdownPreview content={document.content} />
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tags Dialog */}
      <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Add or remove tags for this document
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h4 className="mb-2 text-sm font-medium">Current Tags</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {document.tags && document.tags.length > 0 ? (
                document.tags.map((tag) => (
                  <Badge
                    key={tag.tag.id}
                    className="flex items-center gap-1 cursor-pointer"
                    style={{
                      backgroundColor: tag.tag.color || undefined,
                      color: tag.tag.color ? 'white' : undefined
                    }}
                    onClick={() => removeTag(tag.tag.id)}
                  >
                    {tag.tag.name}
                    <span className="ml-1">×</span>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">No tags</span>
              )}
            </div>
            
            <h4 className="mb-2 text-sm font-medium">Available Tags</h4>
            <div className="flex flex-wrap gap-2">
              {availableTags
                .filter(
                  (tag) =>
                    !document.tags?.some((t) => t.tag.id === tag.id)
                )
                .map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer"
                    style={{
                      backgroundColor: tag.color || undefined,
                      color: tag.color ? 'white' : undefined,
                      borderColor: tag.color || undefined
                    }}
                    onClick={() => addTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of this document
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {document.versions && document.versions.length > 0 ? (
              document.versions.map((version, index) => (
                <div
                  key={version.id}
                  className="mb-4 p-4 border border-border rounded-md"
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      Version {document.versions!.length - index}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(version.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2 line-clamp-3">
                    {version.content.slice(0, 150)}...
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreVersion(version)}
                  >
                    Restore this version
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No version history available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Uploader Dialog */}
      <Dialog open={showPdfUploader} onOpenChange={setShowPdfUploader}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import PDF</DialogTitle>
            <DialogDescription>
              Upload a PDF file to extract its text content
            </DialogDescription>
          </DialogHeader>
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-border rounded-md p-10 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <input {...getInputProps()} />
            {uploadingPdf ? (
              <p>Processing PDF...</p>
            ) : (
              <>
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag &amp; drop a PDF here, or click to select a file
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdfUploader(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}