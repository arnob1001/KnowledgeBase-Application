"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Trash, Plus, Tag } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>("");
  const [newTagColor, setNewTagColor] = useState<string>("#3B82F6");
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/tags");
        if (!response.ok) throw new Error("Failed to fetch tags");
        const data = await response.json();
        setTags(data);
      } catch (error) {
        console.error("Error fetching tags:", error);
        toast.error("Failed to load tags");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create tag");
      }

      const newTag = await response.json();
      setTags([...tags, newTag]);
      setIsCreating(false);
      setNewTagName("");
      toast.success("Tag created successfully");
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create tag");
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      const response = await fetch(`/api/tags/${tagToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete tag");

      setTags(tags.filter((tag) => tag.id !== tagToDelete));
      setTagToDelete(null);
      toast.success("Tag deleted successfully");
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Tags</h1>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new tag</DialogTitle>
              <DialogDescription>
                Tags help you organize and filter your documents
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  placeholder="Enter tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Tag Color</Label>
                <div className="flex gap-2 items-center">
                  <div 
                    className="w-8 h-8 rounded-md border"
                    style={{ backgroundColor: newTagColor }}
                  />
                  <Input
                    id="color"
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Preview</Label>
                <div className="mt-1">
                  <Badge
                    style={{ backgroundColor: newTagColor, color: 'white' }}
                  >
                    {newTagName || "Tag name"}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tags.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: tag.color || undefined,
                          color: tag.color ? 'white' : undefined
                        }}
                      >
                        {tag.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tag.color ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md border"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {tag.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No color</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AlertDialog
                        open={tagToDelete === tag.id}
                        onOpenChange={(open) =>
                          setTagToDelete(open ? tag.id : null)
                        }
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete tag</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the tag "{tag.name}"? This will
                              remove it from all documents.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={handleDeleteTag}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No tags found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first tag to organize your documents
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}