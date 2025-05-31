import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { extractTextFromPDF, savePDFData } from "@/lib/pdf";

// POST /api/upload/pdf - Upload and process a PDF file
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const documentId = formData.get("documentId") as string;
    const pdfFile = formData.get("file") as File;
    
    if (!documentId || !pdfFile) {
      return NextResponse.json(
        { message: "Document ID and PDF file are required" },
        { status: 400 }
      );
    }

    // Check if document exists and belongs to the user
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        authorId: session.user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { message: "Document not found or unauthorized" },
        { status: 404 }
      );
    }

    // Read file as array buffer
    const fileBuffer = await pdfFile.arrayBuffer();
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(fileBuffer);
    
    // Save PDF data
    const pdfData = await savePDFData(
      documentId,
      pdfFile.name,
      pdfFile.size,
      extractedText
    );

    return NextResponse.json({
      message: "PDF processed successfully",
      pdfData,
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { message: "Error processing PDF file" },
      { status: 500 }
    );
  }
}