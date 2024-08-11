import { SubscriptionTier } from "@shared/schema";

export const DOCUMENT_TYPES = [
  { id: "article", name: "Article" },
  { id: "beamer", name: "Beamer (Slides)" },
  { id: "report", name: "Report" },
  { id: "letter", name: "Letter" },
  { id: "book", name: "Book" },
];

export const LATEX_TEMPLATES = {
  math: `<MATHEQ>
E = mc^2
</MATHEQ>`,
  table: `<TABLE>
headers: Item, Value, Unit
row: Example, 1.0, kg
</TABLE>`,
  figure: `<FIGURE>
description: A sample figure
caption: Sample Figure
</FIGURE>`,
  section: `<SECTION>
title: New Section
content: This is content for the new section.
</SECTION>`,
  list: `<LIST>
item 1;
item 2;
item 3
</LIST>`
};

export const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o (OpenAI)", tier: SubscriptionTier.Power, default: true },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (OpenAI)", tier: SubscriptionTier.Basic },
  { id: "claude-3-7-sonnet-20250219", name: "Claude 3 Sonnet (Anthropic)", tier: SubscriptionTier.Pro },
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku (Anthropic)", tier: SubscriptionTier.Basic },
  { id: "mixtral-8x7b", name: "Mixtral 8x7B (Groq)", tier: SubscriptionTier.Free }
];

export const SUBSCRIPTION_FEATURES = {
  [SubscriptionTier.Free]: [
    "3 LaTeX generations/month",
    "View generated LaTeX",
    "View compiled preview (low-res)",
    "Watermarked PDFs"
  ],
  [SubscriptionTier.Basic]: [
    "50 LaTeX generations/month",
    "High-resolution PDF export",
    "Saved document history",
    "No watermarks"
  ],
  [SubscriptionTier.Pro]: [
    "250 LaTeX generations/month",
    "Everything in Basic",
    "Table splitting & advanced layouts",
    "Beamer presentations & TikZ preview"
  ],
  [SubscriptionTier.Power]: [
    "1,000+ LaTeX generations/month",
    "Everything in Pro",
    "Priority AI queue",
    "Advanced templates",
    "Live math editing"
  ]
};

export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    me: "/api/auth/me"
  },
  latex: {
    generate: "/api/latex/generate",
    compile: "/api/latex/compile",
    documents: "/api/documents",
    document: (id: string | number) => `/api/documents/${id}`
  },
  subscription: {
    create: "/api/subscription/create",
    manage: "/api/subscription/manage",
    cancel: "/api/subscription/cancel",
    portal: "/api/subscription/portal"
  }
};
