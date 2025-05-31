"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import debounce from "lodash.debounce";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Search as SearchIcon,
  Tag,
  Clock,
  User,
  File,
  X
} from "lucide-react";
import Link from "next/link";
import { SearchResult } from "@/lib/search";
import { formatDate } from "@/lib/utils";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<{id: string, name: string, color: string | null}[]>([]);
  
  // Extract unique tags from results
  const getTagsFromResults = useCallback(() => {
    if (!results.length) return [];
    
    const tags: {id: string, name: string, color: string | null}[] = [];
    const tagIds = new Set<string>();
    
    results.forEach((result) => {
      result.item.tags?.forEach((tagItem) => {
        if (!tagIds.has(tagItem.tag.id)) {
          tagIds.add(tagItem.tag.id);
          tags.push({
            id: tagItem.tag.id,
            name: tagItem.tag.name,
            color: tagItem.tag.color
          });
        }
      });
    });
    
    return tags;
  }, [results]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        
        if (!response.ok) {
          throw new Error("Search failed");
        }
        
        const data = await response.json();
        setResults(data.results);
        
        // Update URL
        const params = new URLSearchParams(searchParams);
        params.set("q", searchQuery);
        router.push(`/search?${params.toString()}`, { scroll: false });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [searchParams, router]
  );

  // Filter results by selected tags
  const filteredResults = selectedTags.length > 0
    ? results.filter((result) => 
        result.item.tags?.some((tagItem) => 
          selectedTags.includes(tagItem.tag.id)
        )
      )
    : results;

  // Highlight search matches
  const highlightMatches = (text: string, matches: any[] | undefined, key: string) => {
    if (!matches) return text;
    
    const match = matches.find((m) => m.key === key);
    if (!match) return text;
    
    let highlighted = text;
    let offset = 0;
    
    match.indices
      .sort((a: number[], b: number[]) => a[0] - b[0])
      .forEach((index: number[]) => {
        const [start, end] = index;
        const prefix = highlighted.substring(0, start + offset);
        const highlight = highlighted.substring(start + offset, end + 1 + offset);
        const suffix = highlighted.substring(end + 1 + offset);
        
        highlighted = `${prefix}<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-1 py-0.5">${highlight}</mark>${suffix}`;
        offset += 67; // Length of the mark tags
      });
    
    return highlighted;
  };

  // Effect to perform search when query changes
  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
    }
    
    if (query.trim()) {
      setLoading(true);
      debouncedSearch(query);
    }
  }, [query, initialQuery, debouncedSearch]);
  
  // Update available tags when results change
  useEffect(() => {
    setAvailableTags(getTagsFromResults());
  }, [results, getTagsFromResults]);
  
  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Document Search</h1>
      
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents..."
          className="pl-10"
        />
      </div>
      
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {!loading && query && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{query}"
            </h2>
            
            {(selectedTags.length > 0 || availableTags.length > 0) && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Filter by:</span>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color || undefined : undefined,
                        color: selectedTags.includes(tag.id) && tag.color ? 'white' : undefined
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  
                  {selectedTags.length > 0 && (
                    <Button size="sm" variant="ghost" onClick={clearFilters} className="h-6 px-2 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <Card key={result.item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <Link 
                      href={`/documents/${result.item.id}`} 
                      className="block"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <h3 
                          className="text-lg font-medium"
                          dangerouslySetInnerHTML={{
                            __html: highlightMatches(result.item.title, result.matches, "title")
                          }}
                        />
                      </div>
                      
                      <p 
                        className="text-sm text-muted-foreground mb-3 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatches(
                            result.item.excerpt || result.item.content.slice(0, 150) + "...",
                            result.matches,
                            result.matches?.some(m => m.key === "excerpt") ? "excerpt" : "content"
                          )
                        }}
                      />
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <User className="mr-1 h-3.5 w-3.5" />
                          <span>{result.item.author.name}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3.5 w-3.5" />
                          <span>{formatDate(result.item.updatedAt)}</span>
                        </div>
                        
                        {result.item.tags && result.item.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {result.item.tags.map((tagItem) => (
                              <Badge
                                key={tagItem.tag.id}
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px]"
                                style={{
                                  backgroundColor: tagItem.tag.color ? `${tagItem.tag.color}30` : undefined,
                                  color: tagItem.tag.color || undefined
                                }}
                              >
                                {tagItem.tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              query.trim() && (
                <div className="text-center py-12">
                  <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No results found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your search or filter to find what you're looking for
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
      
      {!loading && !query && (
        <div className="text-center py-12">
          <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-medium">Start searching</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a search term to find documents in your knowledge base
          </p>
        </div>
      )}
    </div>
  );
}