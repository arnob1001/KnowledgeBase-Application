import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateExcerpt } from "@/lib/utils";

// GET /api/documents - Get user's documents
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const tagId = url.searchParams.get("tagId");
    const isPublic = url.searchParams.get("isPublic");

    // Build query based on filters
    const query: any = { authorId: session.user.id };
    
    if (tagId) {
      query.tags = {
        some: {
          tagId,
        },
      };
    }
    
    if (isPublic) {
      query.isPublic = isPublic === "true";
    }

    const documents = await prisma.document.findMany({
      where: query,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create a new document
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    // Generate excerpt from content
    const excerpt = generateExcerpt(content);

    // Create the document
    const document = await prisma.document.create({
      data: {
        title,
        content,
        excerpt,
        authorId: session.user.id,
        // Create initial version
        versions: {
          create: {
            content,
          },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}