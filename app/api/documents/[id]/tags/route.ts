import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/documents/[id]/tags - Add a tag to a document
export async function POST(
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
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json(
        { message: "Tag ID is required" },
        { status: 400 }
      );
    }

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

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: {
        id: tagId,
      },
    });

    if (!tag) {
      return NextResponse.json(
        { message: "Tag not found" },
        { status: 404 }
      );
    }

    // Check if the tag is already associated with the document
    const existingTag = await prisma.documentTag.findUnique({
      where: {
        documentId_tagId: {
          documentId,
          tagId,
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { message: "Tag already added to document" },
        { status: 409 }
      );
    }

    // Add tag to document
    await prisma.documentTag.create({
      data: {
        documentId,
        tagId,
        userId: session.user.id,
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
    console.error("Error adding tag to document:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}