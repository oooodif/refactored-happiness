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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function DocumentHistory() {
  const { session } = useContext(UserContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  /* Redirect unauthenticated users */
  useEffect(() => {
    if (!session.isAuthenticated) navigate("/login");
  }, [session.isAuthenticated]);

  /* Fetch documents */
  const {
    data: documents,
    isLoading,
    error,
  } = useQuery<Document[]>({
    queryKey: [API_ROUTES.latex.documents],
    enabled: session.isAuthenticated,
  });

  /* Null‑safe search filter */
  const filteredDocuments = documents?.filter(
    (doc) =>
      (doc.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.inputContent ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /* Handlers */
  const handleEditDocument = (id: number) => navigate(`/?documentId=${id}`);

  const handleDeleteDocument = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await fetch(`${API_ROUTES.latex.document(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast({ title: "Document Deleted", description: "File removed." });
      await new Promise((r) => setTimeout(r, 400));
      window.location.reload();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      const res = await fetch(`${API_ROUTES.latex.document(id)}/pdf`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const { pdf } = await res.json();
      if (!pdf) throw new Error("No PDF found");

      const doc = documents?.find((d) => d.id === id);
      const extracted = doc
        ? await extractTitleFromLatex(doc.latexContent)
        : null;
      const name = extracted || doc?.title || "document";
      downloadPdf(pdf, name);

      if (
        extracted &&
        extracted !== doc?.title &&
        extracted !== "Generated Document"
      ) {
        toast({
          title: "Title Extracted",
          description: `AI title: "${extracted}"`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Download failed",
        variant: "destructive",
      });
    }
  };

  if (!session.isAuthenticated) return null;

  return (
    <SiteLayout fullHeight={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Document History
              </h1>
              <p className="text-gray-600 mt-1">
                View and manage your previously generated LaTeX documents
              </p>
            </div>
            <Button
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/")}
            >
              Create New Document
            </Button>
          </div>

          {/* Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Your Documents</CardTitle>
                  <CardDescription>
                    {documents?.length ?? 0} document
                    {documents?.length !== 1 ? "s" : ""} total
                  </CardDescription>
                </div>
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 mt-4 md:mt-0"
                />
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="mt-2 text-gray-600">
                    Loading your documents...
                  </p>
                </div>
              ) : error ? (
                <p className="text-center py-12 text-red-500">
                  Error loading documents
                </p>
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
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          {doc.title ?? "Untitled Document"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.documentType}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        <TableCell>
                          {doc.compilationSuccessful ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                              Compiled
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Error</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDocument(doc.id)}
                          >
                            Edit
                          </Button>
                          {doc.compilationSuccessful && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPdf(doc.id)}
                            >
                              PDF
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900">
                    No documents found
                  </h3>
                  <p className="mt-1 text-gray-500">
                    {searchTerm
                      ? "No matching documents."
                      : "You haven't created any LaTeX documents yet."}
                  </p>
                  <Button
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate("/")}
                  >
                    Create Your First Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}
