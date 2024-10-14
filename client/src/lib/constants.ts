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
</LIST>`,
  slide: `<SLIDE>
title: Slide Title
content: Slide content goes here.
</SLIDE>`
};

export const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o (OpenAI)", tier: SubscriptionTier.Power, default: true },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (OpenAI)", tier: SubscriptionTier.Basic },
  { id: "claude-3-7-sonnet-20250219", name: "Claude 3 Sonnet (Anthropic)", tier: SubscriptionTier.Pro },
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku (Anthropic)", tier: SubscriptionTier.Basic },
  { id: "llama3-8b-8192", name: "Llama3 8B (Groq)", tier: SubscriptionTier.Free },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (Groq)", tier: SubscriptionTier.Free }
];

export const SUBSCRIPTION_FEATURES = {
  [SubscriptionTier.Free]: [
    "3 LaTeX generations/month"
  ],
  [SubscriptionTier.Basic]: [
    "50 LaTeX generations/month"
  ],
  [SubscriptionTier.Pro]: [
    "250 LaTeX generations/month"
  ],
  [SubscriptionTier.Power]: [
    "1,000 LaTeX generations/month"
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
