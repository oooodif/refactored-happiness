import { User, Document, SubscriptionTier } from "@shared/schema";

export interface LatexCompilationResult {
  success: boolean;
  pdf?: string; // base64 encoded PDF
  error?: string;
  errorDetails?: {
    line: number;
    message: string;
  }[];
}

export interface GenerateLatexResponse {
  latex: string;
  compilationResult: LatexCompilationResult;
  documentId?: number;
}

export interface UserSession {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tier: SubscriptionTier;
  usage: {
    current: number;
    limit: number;
    resetDate: string;
  };
  refillPackCredits: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface EditorState {
  inputContent: string;
  latexContent: string;
  documentType: string;
  compilationResult: LatexCompilationResult | null;
  isGenerating: boolean;
  documentId?: number;
  title: string;
}

export interface DocumentHistoryItem extends Document {
  formattedDate: string;
}

export interface AIProviderInfo {
  id: string;
  name: string;
  requiresApiKey: boolean;
  isAvailable: boolean;
  minimumTier: SubscriptionTier;
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface SubscriptionOption {
  id: SubscriptionTier;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
  isCurrentPlan?: boolean;
}

export interface LaTeXTemplate {
  id: string;
  name: string;
  content: string;
}

export interface LatexGenerationOptions {
  model?: string;
  splitTables?: boolean;
  useMath?: boolean;
}

export interface ErrorNotificationData {
  title: string;
  message: string;
  actions?: {
    label: string;
    action: () => void;
  }[];
}
