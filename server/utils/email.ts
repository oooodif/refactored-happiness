import { ServerClient } from 'postmark';

if (!process.env.POSTMARK_API_KEY) {
  console.warn('Missing POSTMARK_API_KEY environment variable. Email functionality will be disabled.');
}

const client = process.env.POSTMARK_API_KEY 
  ? new ServerClient(process.env.POSTMARK_API_KEY)
  : null;

export const FROM_EMAIL = 'no-reply@ailatexgenerator.com';

/**
 * Tests the connection to Postmark API
 */
export async function testPostmarkConnection(): Promise<{ success: boolean; message: string }> {
  if (!client) {
    return { 
      success: false, 
      message: 'Postmark client not initialized (missing API key)' 
    };
  }

  try {
    const response = await client.getServer();
    return { 
      success: true, 
      message: `Connected to Postmark server: ${response.Name}` 
    };
  } catch (error: any) {
    console.error('Postmark connection error:', error);
    return { 
      success: false, 
      message: `Failed to connect to Postmark: ${error.message || 'Unknown error'}` 
    };
  }
}

/**
 * Sends a verification email to the user
 */
export async function sendVerificationEmail(
  email: string, 
  verificationToken: string
): Promise<{ success: boolean; message: string }> {
  if (!client) {
    return { 
      success: false, 
      message: 'Email service not available' 
    };
  }

  try {
    // Create the verification link - in production this would be your domain
    const verificationLink = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
    
    const response = await client.sendEmail({
      From: FROM_EMAIL,
      To: email,
      Subject: 'Verify your AI LaTeX Generator account',
      HtmlBody: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #2563eb; margin-bottom: 24px;">Verify your email address</h1>
          <p style="margin-bottom: 24px; font-size: 16px; line-height: 24px;">
            Thank you for signing up for the AI LaTeX Generator! Please click the button below to verify your email address.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify my email
            </a>
          </div>
          <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${verificationLink}" style="color: #2563eb; word-break: break-all;">
              ${verificationLink}
            </a>
          </p>
        </div>
      `,
      TextBody: `
        Verify your AI LaTeX Generator account
        
        Thank you for signing up for the AI LaTeX Generator! Please visit the link below to verify your email address:
        
        ${verificationLink}
        
        If you didn't create an account, you can safely ignore this email.
      `,
      MessageStream: 'outbound'
    });
    
    return { 
      success: true, 
      message: `Verification email sent: ${response.MessageID}` 
    };
  } catch (error: any) {
    console.error('Failed to send verification email:', error);
    return { 
      success: false, 
      message: `Failed to send verification email: ${error.message || 'Unknown error'}` 
    };
  }
}