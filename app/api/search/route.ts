import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchDocuments } from "@/lib/search";

// GET /api/search?q=query - Search documents
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    
    if (!query) {
      return NextResponse.json(
        { message: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const searchResults = await searchDocuments(query, userId);
    
    return NextResponse.json({ results: searchResults });
  } catch (error) {
    console.error("Error searching documents:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}