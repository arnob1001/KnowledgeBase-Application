import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DocumentEditor from "@/components/documents/document-editor";

interface DocumentPageProps {
  params: {
    id: string;
  };
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  if (params.id === "new") {
    return (
      <div className="container mx-auto p-4">
        <DocumentEditor 
          initialDocument={{
            id: "",
            title: "Untitled Document",
            content: "# Untitled Document\n\nStart writing your document here...",
            excerpt: null,
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            authorId: session.user.id,
          }}
          isNew={true}
        />
      </div>
    );
  }

  const document = await prisma.document.findUnique({
    where: {
      id: params.id,
    },
    include: {
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
    },
  });

  if (!document) {
    notFound();
  }

  // Check if user is the author
  if (document.authorId !== session.user.id) {
    // If not author and document is not public, redirect
    if (!document.isPublic) {
      redirect("/dashboard");
    }
    
    // If not author but document is public, show read-only view
    return (
      <div className="container mx-auto p-4">
        <DocumentEditor 
          initialDocument={document} 
          readOnly={true}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <DocumentEditor initialDocument={document} />
    </div>
  );
}