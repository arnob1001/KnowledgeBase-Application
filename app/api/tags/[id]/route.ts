import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/tags/[id] - Get a tag by ID
export async function GET(
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

    const tagId = params.id;

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

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/tags/[id] - Update a tag
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

    const tagId = params.id;
    const body = await req.json();
    const { name, color } = body;

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

    // Update tag
    const updatedTag = await prisma.tag.update({
      where: {
        id: tagId,
      },
      data: {
        name: name !== undefined ? name : undefined,
        color: color !== undefined ? color : undefined,
      },
    });

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/[id] - Delete a tag
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

    const tagId = params.id;

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

    // Delete tag (cascade will remove references in DocumentTag)
    await prisma.tag.delete({
      where: {
        id: tagId,
      },
    });

    return NextResponse.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}