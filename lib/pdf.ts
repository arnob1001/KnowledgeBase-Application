import * as pdfjsLib from 'pdfjs-dist';
import prisma from './prisma';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(file: ArrayBuffer): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: file }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Save PDF data to the database and associate with a document
 */
export async function savePDFData(
  documentId: string,
  filename: string,
  fileSize: number,
  extractedText: string
) {
  try {
    // Check if there's already a PDF associated with this document
    const existingPdf = await prisma.pdfData.findUnique({
      where: { documentId }
    });

    // Update or create PDF data
    if (existingPdf) {
      return await prisma.pdfData.update({
        where: { id: existingPdf.id },
        data: {
          filename,
          fileSize,
          extractedText,
          updatedAt: new Date()
        }
      });
    } else {
      return await prisma.pdfData.create({
        data: {
          documentId,
          filename,
          fileSize,
          extractedText,
        }
      });
    }
  } catch (error) {
    console.error('Error saving PDF data:', error);
    throw new Error('Failed to save PDF data');
  }
}