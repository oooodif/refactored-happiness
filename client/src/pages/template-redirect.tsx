import { useEffect, useContext } from "react";
import { useRoute, useLocation } from "wouter";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { UserContext } from "@/App";
import { Loader2 } from "lucide-react";

export default function TemplateRedirect() {
  const [, params] = useRoute<{ type: string }>("/template/:type");
  const [, navigate] = useLocation();
  const { session } = useContext(UserContext);
  
  useEffect(() => {
    // Get the template type from the URL
    const templateType = params?.type || "";
    
    // Check if it's a valid template type
    const isValidTemplate = DOCUMENT_TYPES.some(doc => doc.id === templateType);
    
    if (!isValidTemplate) {
      // If invalid template, redirect to homepage
      navigate("/");
      return;
    }
    
    // We'll store the selected template in localStorage so the homepage can access it
    localStorage.setItem("selectedTemplate", templateType);
    
    // Redirect to homepage which will use the selected template
    navigate("/");
  }, [params, navigate, session]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Loading template...</span>
    </div>
  );
}