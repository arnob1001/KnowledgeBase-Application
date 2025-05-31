import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/tags - Get all tags
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tags = await prisma.tag.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tags - Create a new tag
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
    const { name, color } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Tag name is required" },
        { status: 400 }
      );
    }

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: {
        name,
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { message: "Tag already exists" },
        { status: 409 }
      );
    }

    // Create the tag
    const tag = await prisma.tag.create({
      data: {
        name,
        color,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}