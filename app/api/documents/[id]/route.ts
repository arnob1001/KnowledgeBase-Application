import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateExcerpt } from "@/lib/utils";

// GET /api/documents/[id] - Get a document by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const documentId = params.id;

    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
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
          include: {
            tag: true,
          },
        },
        versions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        pdfData: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

    // Check if user has access to the document
    const isOwner = document.author.id === session?.user?.id;
    if (!document.isPublic && !isOwner) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[id] - Update a document
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const documentId = params.id;
    const body = await req.json();

    // Check if document exists and user is the author
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        authorId: true,
        content: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

    if (document.authorId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Prepare data for update
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) {
      updateData.content = body.content;
      updateData.excerpt = generateExcerpt(body.content);
      
      // Create a new version if content changed
      if (body.content !== document.content) {
        await prisma.documentVersion.create({
          data: {
            content: body.content,
            documentId,
          },
        });
      }
    }
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

    // Update document
    const updatedDocument = await prisma.document.update({
      where: {
        id: documentId,
      },
      data: updateData,
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const documentId = params.id;

    // Check if document exists and user is the author
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        authorId: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

    if (document.authorId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete document
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}