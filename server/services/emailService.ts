import { ServerClient } from 'postmark';

// Create a Postmark client for sending emails
let postmarkClient: ServerClient | null = null;

// Initialize Postmark client
export function initPostmarkClient() {
  const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;
  
  if (!POSTMARK_API_KEY) {
    console.warn('Missing POSTMARK_API_KEY, email functionality will be limited');
    return;
  }
  
  postmarkClient = new ServerClient(POSTMARK_API_KEY);
  console.log('Postmark client initialized');
}

// Types for email templates
export enum EmailTemplates {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset',
  SUBSCRIPTION_CONFIRMATION = 'subscription-confirmation',
  PAYMENT_RECEIPT = 'payment-receipt',
  USAGE_ALERT = 'usage-alert',
}

// Send welcome email when a user signs up
export async function sendWelcomeEmail(user: { email: string; username: string }) {
  if (!postmarkClient) {
    console.warn('Postmark client not initialized, skipping welcome email');
    return;
  }
  
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      TemplateAlias: EmailTemplates.WELCOME,
      From: 'support@aitexgen.com',
      To: user.email,
      TemplateModel: {
        username: user.username,
        product_name: 'AI LaTeX Generator',
        login_url: 'https://aitexgen.com/login',
        support_email: 'support@aitexgen.com',
      },
    });
    
    console.log(`Welcome email sent to ${user.email}, Postmark ID: ${result.MessageID}`);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(user: { email: string; username: string }, resetToken: string) {
  if (!postmarkClient) {
    console.warn('Postmark client not initialized, skipping password reset email');
    return;
  }
  
  const resetUrl = `https://aitexgen.com/reset-password?token=${resetToken}`;
  
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      TemplateAlias: EmailTemplates.PASSWORD_RESET,
      From: 'support@aitexgen.com',
      To: user.email,
      TemplateModel: {
        username: user.username,
        product_name: 'AI LaTeX Generator',
        reset_url: resetUrl,
        support_email: 'support@aitexgen.com',
        hours_valid: 24, // Token valid for 24 hours
      },
    });
    
    console.log(`Password reset email sent to ${user.email}, Postmark ID: ${result.MessageID}`);
    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

// Send subscription confirmation email
export async function sendSubscriptionConfirmationEmail(
  user: { email: string; username: string },
  subscription: { tier: string; price: number; nextBillingDate: string }
) {
  if (!postmarkClient) {
    console.warn('Postmark client not initialized, skipping subscription confirmation email');
    return;
  }
  
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      TemplateAlias: EmailTemplates.SUBSCRIPTION_CONFIRMATION,
      From: 'billing@aitexgen.com',
      To: user.email,
      TemplateModel: {
        username: user.username,
        product_name: 'AI LaTeX Generator',
        subscription_tier: subscription.tier,
        subscription_price: `$${subscription.price.toFixed(2)}`,
        next_billing_date: new Date(subscription.nextBillingDate).toLocaleDateString(),
        account_url: 'https://aitexgen.com/account',
        support_email: 'support@aitexgen.com',
      },
    });
    
    console.log(`Subscription confirmation email sent to ${user.email}, Postmark ID: ${result.MessageID}`);
    return result;
  } catch (error) {
    console.error('Failed to send subscription confirmation email:', error);
    throw error;
  }
}

// Send payment receipt email
export async function sendPaymentReceiptEmail(
  user: { email: string; username: string },
  payment: { amount: number; date: string; description: string; invoiceNumber: string }
) {
  if (!postmarkClient) {
    console.warn('Postmark client not initialized, skipping payment receipt email');
    return;
  }
  
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      TemplateAlias: EmailTemplates.PAYMENT_RECEIPT,
      From: 'billing@aitexgen.com',
      To: user.email,
      TemplateModel: {
        username: user.username,
        product_name: 'AI LaTeX Generator',
        payment_amount: `$${payment.amount.toFixed(2)}`,
        payment_date: new Date(payment.date).toLocaleDateString(),
        payment_description: payment.description,
        invoice_number: payment.invoiceNumber,
        account_url: 'https://aitexgen.com/account',
        support_email: 'support@aitexgen.com',
      },
    });
    
    console.log(`Payment receipt email sent to ${user.email}, Postmark ID: ${result.MessageID}`);
    return result;
  } catch (error) {
    console.error('Failed to send payment receipt email:', error);
    throw error;
  }
}

// Send usage alert email when user is approaching their limit
export async function sendUsageAlertEmail(
  user: { email: string; username: string },
  usage: { current: number; limit: number; resetDate: string }
) {
  if (!postmarkClient) {
    console.warn('Postmark client not initialized, skipping usage alert email');
    return;
  }
  
  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      TemplateAlias: EmailTemplates.USAGE_ALERT,
      From: 'support@aitexgen.com',
      To: user.email,
      TemplateModel: {
        username: user.username,
        product_name: 'AI LaTeX Generator',
        current_usage: usage.current,
        usage_limit: usage.limit,
        usage_percentage: Math.round((usage.current / usage.limit) * 100),
        reset_date: new Date(usage.resetDate).toLocaleDateString(),
        upgrade_url: 'https://aitexgen.com/upgrade',
        support_email: 'support@aitexgen.com',
      },
    });
    
    console.log(`Usage alert email sent to ${user.email}, Postmark ID: ${result.MessageID}`);
    return result;
  } catch (error) {
    console.error('Failed to send usage alert email:', error);
    throw error;
  }
}