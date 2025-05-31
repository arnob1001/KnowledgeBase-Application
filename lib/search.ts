import Fuse from 'fuse.js';
import prisma from './prisma';
import { Document, User } from '@prisma/client';

export type SearchableDocument = Document & {
  author: Pick<User, 'id' | 'name' | 'email'>;
  tags: Array<{ tagId: string; tag: { id: string; name: string; color: string | null } }>;
};

export type SearchResult = {
  item: SearchableDocument;
  matches?: ReadonlyArray<{
    indices: ReadonlyArray<[number, number]>;
    key: string;
    value: string;
  }>;
};

// Fuse.js options for fuzzy search
const searchOptions = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'content', weight: 1.5 },
    { name: 'excerpt', weight: 1 },
    { name: 'author.name', weight: 0.5 },
    { name: 'tags.tag.name', weight: 1 }
  ],
  includeMatches: true,
  threshold: 0.3, // Lower threshold means more strict matching
  minMatchCharLength: 2,
};

export async function searchDocuments(
  query: string, 
  userId?: string,
  limit: number = 20
): Promise<SearchResult[]> {
  // Fetch documents that the user can see (public or owned by the user)
  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { isPublic: true },
        { authorId: userId || '' },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tags: {
        select: {
          tagId: true,
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const fuse = new Fuse(documents, searchOptions);
  
  // Perform the search
  const searchResults = fuse.search(query);
  
  // Limit the number of results
  return searchResults.slice(0, limit);
}