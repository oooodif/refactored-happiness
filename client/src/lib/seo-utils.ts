import { DOCUMENT_TYPES } from "./constants";

/**
 * Utility functions for SEO enhancement
 */

export interface TemplateSeoData {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  schemaData: object;
}

/**
 * Get SEO data for specific template type
 * @param templateType The document template type (article, presentation, etc.)
 * @returns Object with SEO metadata for the template
 */
export function getTemplateSeoData(templateType: string): TemplateSeoData {
  // Find the document type object
  const docType = DOCUMENT_TYPES.find(dt => dt.id === templateType);
  const name = docType?.name || "Document";
  
  // Default SEO values
  const defaults = {
    title: `AI LaTeX Generator - Create ${name}s | Professional LaTeX Tool`,
    description: `Generate professional LaTeX ${name.toLowerCase()}s with AI assistance. Create well-formatted ${name.toLowerCase()}s in seconds with our LaTeX generator.`,
    ogImage: "https://aitexgen.com/templates/og-image.png",
    twitterImage: "https://aitexgen.com/templates/twitter-card.png"
  };
  
  // Template-specific schema data
  const schemaData: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AI LaTeX Generator",
    "applicationCategory": "WebApplication",
    "operatingSystem": "Web",
    "description": `AI-powered LaTeX generator for ${name.toLowerCase()}s and academic documents`,
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    }
  };
  
  // Add template-specific features based on type
  switch(templateType) {
    case "article":
      schemaData.featureList = "Academic article templates, IEEE format, ACM format, bibliography support";
      break;
    case "presentation":
      schemaData.featureList = "Beamer presentation templates, slide transitions, figure integration";
      break;
    case "report":
      schemaData.featureList = "Professional reports, executive summaries, charts and figures support";
      break;
    case "letter":
      schemaData.featureList = "Formal letter templates, cover letters, letterhead customization";
      break;
    case "book":
      schemaData.featureList = "Book formatting, chapter organization, bibliography, indexing";
      break;
    default:
      schemaData.featureList = "LaTeX document generation, custom formatting, PDF export";
  }
  
  // Return complete SEO data object
  return {
    title: defaults.title,
    description: defaults.description,
    ogTitle: defaults.title,
    ogDescription: defaults.description,
    ogImage: defaults.ogImage,
    twitterTitle: defaults.title,
    twitterDescription: defaults.description,
    twitterImage: defaults.twitterImage,
    schemaData
  };
}

/**
 * Update document title and meta tags for SEO
 * @param title Page title
 * @param description Meta description
 */
export function updateDocumentSeo(title: string, description: string): void {
  // Update document title
  document.title = title;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
  
  // Update Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  
  if (ogTitle) ogTitle.setAttribute('content', title);
  if (ogDescription) ogDescription.setAttribute('content', description);
  
  // Update Twitter Card tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  
  if (twitterTitle) twitterTitle.setAttribute('content', title);
  if (twitterDescription) twitterDescription.setAttribute('content', description);
}

/**
 * Generate JSON-LD structured data script element
 * @param data Structured data object
 * @returns HTML script element with JSON-LD data
 */
export function createSchemaScript(data: object): HTMLScriptElement {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  return script;
}