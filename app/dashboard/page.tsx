import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import DocumentList from "@/components/dashboard/document-list";
import RecentActivity from "@/components/dashboard/recent-activity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Dashboard | DocuMind",
  description: "Manage your documents and knowledge base",
};

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const documents = await prisma.document.findMany({
    where: {
      authorId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    take: 10,
  });

  const recentDocuments = await prisma.document.findMany({
    where: {
      authorId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 5,
  });

  const tags = await prisma.tag.findMany({
    where: {
      documents: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader username={session.user.name || "User"} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="private">Private</TabsTrigger>
                <TabsTrigger value="public">Public</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-0">
              <DocumentList documents={documents} tags={tags} />
            </TabsContent>
            
            <TabsContent value="recent" className="mt-0">
              <DocumentList 
                documents={documents.filter((doc) => 
                  new Date(doc.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                )} 
                tags={tags} 
              />
            </TabsContent>
            
            <TabsContent value="private" className="mt-0">
              <DocumentList 
                documents={documents.filter((doc) => !doc.isPublic)} 
                tags={tags} 
              />
            </TabsContent>
            
            <TabsContent value="public" className="mt-0">
              <DocumentList 
                documents={documents.filter((doc) => doc.isPublic)} 
                tags={tags} 
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-8">
          <RecentActivity documents={recentDocuments} />
        </div>
      </div>
    </div>
  );
}