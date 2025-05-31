# DocuMind - AI Knowledge Base

DocuMind is a full-stack AI knowledge base application built with Next.js 14, Neon DB, and Prisma. It provides a powerful platform for document management with advanced search capabilities.

## Features

- Document management with Markdown editor and live preview
- Advanced search with fuzzy matching and relevance ranking
- PDF text extraction and document indexing
- Tag-based organization with filtering capabilities
- Public/private document visibility control
- Version history tracking with timestamps
- User authentication and role-based permissions
- API endpoints for programmatic access

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes
- **Database:** Neon DB (PostgreSQL)
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Search:** Fuse.js for fuzzy search
- **PDF Processing:** PDF.js
- **Markdown:** React Markdown with syntax highlighting

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Neon database instance

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update with your own Neon DB URL and other credentials

4. Run database migrations:
   ```
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Database Schema

The application uses the following data models:

- `User`: Stores user account information
- `Document`: Stores document content, metadata, and visibility settings
- `DocumentVersion`: Tracks version history of documents
- `Tag`: Organizes documents by categories
- `DocumentTag`: Links tags to documents
- `PdfData`: Stores extracted text from PDF files

## API Endpoints

DocuMind provides the following API endpoints:

- `/api/auth/*`: Authentication endpoints
- `/api/documents`: CRUD operations for documents
- `/api/documents/[id]/tags`: Tag management for documents
- `/api/search`: Advanced document search
- `/api/tags`: Tag management
- `/api/upload/pdf`: PDF processing and text extraction

## License

This project is licensed under the MIT License.