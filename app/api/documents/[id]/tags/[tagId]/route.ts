import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE /api/documents/[id]/tags/[tagId] - Remove a tag from a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; tagId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: documentId, tagId } = params;

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

    // Remove tag from document
    await prisma.documentTag.delete({
      where: {
        documentId_tagId: {
          documentId,
          tagId,
        },
      },
    });

    // Get updated document with tags
    const updatedDocument = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error removing tag from document:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}