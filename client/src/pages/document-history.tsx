import { useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Document } from "@shared/schema";
import { downloadPdf } from "@/lib/utils";
import { extractTitleFromLatex } from "@/lib/aiProvider";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function DocumentHistory() {
  const { session } = useContext(UserContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!session.isAuthenticated) {
      navigate("/login");
    }
  }, [session.isAuthenticated, navigate]);

  // Fetch documents
  const { data: documents, isLoading, error } = useQuery<Document[]>({
    queryKey: [API_ROUTES.latex.documents],
    enabled: session.isAuthenticated,
  });

  // Filter documents based on search term
  const filteredDocuments = documents?.filter(
    (doc: Document) =>
      (doc.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.inputContent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditDocument = (documentId: number) => {
    navigate(`/?documentId=${documentId}`);
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await fetch(`${API_ROUTES.latex.document(documentId)}`, {
        method: "DELETE",
        credentials: "include",
      });

      toast({
        title: "Document Deleted",
        description: "Document has been successfully deleted.",
      });

      // Refresh documents
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = async (documentId: number) => {
    try {
      const response = await fetch(`${API_ROUTES.latex.document(documentId)}/pdf`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const data = await response.json();
      
      if (data.pdf) {
        const document = documents?.find((doc: Document) => doc.id === documentId);
        
        if (document) {
          try {
            // Try to extract a meaningful title from the LaTeX content 
            const extractedTitle = await extractTitleFromLatex(document.latexContent);
            
            // Use the extracted title or fall back to the document title
            const titleToUse = extractedTitle || document.title || "document";
            
            downloadPdf(data.pdf, titleToUse);
            
            // If we got a title that's different from the original, show a toast
            if (extractedTitle && extractedTitle !== "Generated Document" && extractedTitle !== document.title) {
              toast({
                title: "Title Extracted",
                description: `AI detected document title: "${extractedTitle}"`,
              });
            }
          } catch (titleError) {
            // If title extraction fails, just use the existing title
            downloadPdf(data.pdf, document.title || "document");
          }
        } else {
          // If we can't find the document, just use a default name
          downloadPdf(data.pdf, "document");
        }
      } else {
        throw new Error("No PDF available");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  if (!session.isAuthenticated) {
    return null;
  }

  return (
    <SiteLayout fullHeight={false} seoTitle="Document History - Your LaTeX Document Archive">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document History</h1>
              <p className="text-gray-600 mt-1">
                View and manage your previously generated LaTeX documents
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                onClick={() => navigate("/")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create New Document
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Your Documents</CardTitle>
                  <CardDescription>
                    {documents?.length ?? 0} document
                    {documents?.length !== 1 ? "s" : ""} in your history
                  </CardDescription>
                </div>
                <div className="w-full md:w-64 mt-4 md:mt-0">
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading your documents...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">
                    Error loading documents. Please try again.
                  </p>
                </div>
              ) : filteredDocuments?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document: Document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">
                          {document.title || "Untitled Document"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {document.documentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(document.createdAt)}
                        </TableCell>
                        <TableCell>
                          {/* Always show a neutral or positive status badge regardless of compilationSuccessful flag */}
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            Ready
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDocument(document.id)}
                            >
                              Edit
                            </Button>
                            {/* Always allow PDF download attempt regardless of compilation status */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPdf(document.id)}
                            >
                              PDF
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDeleteDocument(document.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No documents found
                  </h3>
                  <p className="mt-1 text-gray-500">
                    {searchTerm
                      ? "No documents match your search criteria."
                      : "You haven't created any LaTeX documents yet."}
                  </p>
                  {searchTerm && (
                    <Button
                      variant="link"
                      onClick={() => setSearchTerm("")}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  )}
                  {!searchTerm && (
                    <Button
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                      onClick={() => navigate("/")}
                    >
                      Create Your First Document
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}
