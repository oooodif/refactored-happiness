import { useEffect, useContext, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { UserContext } from "@/App";
import { Loader2 } from "lucide-react";
import SiteLayout from "@/components/layout/site-layout";
import { getTemplateSeoData, createSchemaScript, updateDocumentSeo } from "@/lib/seo-utils";

export default function TemplateRedirect() {
  const [, params] = useRoute<{ type: string }>("/template/:type");
  const [, navigate] = useLocation();
  const { session } = useContext(UserContext);
  const [seoTitle, setSeoTitle] = useState<string>("LaTeX Template - AI LaTeX Generator");
  
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
    
    // Apply SEO enhancements for the template page
    const seoData = getTemplateSeoData(templateType);
    
    // Update document title and meta tags
    updateDocumentSeo(seoData.title, seoData.description);
    
    // Update the SEO title for our SiteLayout
    setSeoTitle(`${seoData.title} - AI LaTeX Generator`);
    
    // Add schema.org JSON-LD structured data
    const head = document.querySelector('head');
    if (head) {
      // Remove any existing template-specific schema
      const existingSchema = document.querySelector('script#template-schema');
      if (existingSchema) {
        existingSchema.remove();
      }
      
      // Add new schema
      const schemaScript = createSchemaScript(seoData.schemaData);
      schemaScript.id = 'template-schema';
      head.appendChild(schemaScript);
    }
    
    // We'll store the selected template in localStorage so the homepage can access it
    localStorage.setItem("selectedTemplate", templateType);
    
    // Redirect to homepage which will use the selected template after a short delay
    // to give search engines time to index the template page
    setTimeout(() => {
      navigate("/");
    }, 300);
  }, [params, navigate, session]);
  
  return (
    <SiteLayout seoTitle={seoTitle}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl mb-6">Loading template...</h2>
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Preparing template for you</span>
        </div>
      </div>
    </SiteLayout>
  );
}