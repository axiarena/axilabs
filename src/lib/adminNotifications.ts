// Admin notification system for AXI ASI LAB
// Sends silent notifications to admin when users sign up

// Using the provided SendGrid API key as fallback
const SENDGRID_API_KEY = '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';

interface AdminNotificationData {
  username: string;
  email: string;
  axiNumber: number;
  authType: 'web2' | 'wallet';
  registrationDate: string;
  userAgent?: string;
  ipAddress?: string;
}

const getAdminNotificationTemplate = (data: AdminNotificationData) => ({
  subject: `🎉 New AXI ASI LAB User #${data.axiNumber}: ${data.username}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New User Registration - AXI ASI LAB</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          background: #f8f9fa;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #00d4ff;
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          color: #00d4ff;
          margin-bottom: 10px;
        }
        .user-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #00d4ff;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .info-label {
          font-weight: bold;
          color: #495057;
        }
        .info-value {
          color: #212529;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .badge-web2 {
          background: #28a745;
          color: white;
        }
        .badge-wallet {
          background: #007bff;
          color: white;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          font-size: 14px;
          color: #6c757d;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🧠 AXI ASI LAB - Admin Alert</div>
          <h2 style="color: #333; margin: 0;">New User Registration</h2>
        </div>
        
        <div class="user-info">
          <div class="info-row">
            <span class="info-label">👤 Username:</span>
            <span class="info-value"><strong>${data.username}</strong></span>
          </div>
          
          <div class="info-row">
            <span class="info-label">📧 Email:</span>
            <span class="info-value">${data.email}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">🔢 AXI Number:</span>
            <span class="info-value"><strong>#${data.axiNumber}</strong></span>
          </div>
          
          <div class="info-row">
            <span class="info-label">🔐 Account Type:</span>
            <span class="info-value">
              <span class="badge ${data.authType === 'web2' ? 'badge-web2' : 'badge-wallet'}">
                ${data.authType === 'web2' ? 'Web2 Account' : 'Wallet Connected'}
              </span>
            </span>
          </div>
          
          <div class="info-row">
            <span class="info-label">📅 Registration:</span>
            <span class="info-value">${new Date(data.registrationDate).toLocaleString()}</span>
          </div>
          
          ${data.userAgent ? `
          <div class="info-row">
            <span class="info-label">🌐 Browser:</span>
            <span class="info-value" style="font-size: 12px;">${data.userAgent}</span>
          </div>
          ` : ''}
        </div>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #0066cc; font-weight: bold;">
            🎯 Quick Stats Update:
          </p>
          <p style="margin: 5px 0 0 0; color: #333; font-size: 14px;">
            This user is now part of the AXI ASI LAB community. 
            They can create AXIOMs, engage with content, and level up through the ecosystem.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>AXI ASI LAB Admin Notifications</strong></p>
          <p>This notification was sent automatically when a new user registered.</p>
          <p style="font-size: 12px; margin-top: 15px;">
            🔒 This email is confidential and intended only for admin use.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    🎉 NEW AXI ASI LAB USER REGISTRATION
    
    Username: ${data.username}
    Email: ${data.email}
    AXI Number: #${data.axiNumber}
    Account Type: ${data.authType === 'web2' ? 'Web2 Account' : 'Wallet Connected'}
    Registration: ${new Date(data.registrationDate).toLocaleString()}
    
    This user is now part of the AXI ASI LAB community.
    
    ---
    AXI ASI LAB Admin Notifications
    This notification was sent automatically when a new user registered.
  `
});

// Send admin notification
export const sendAdminNotification = async (userData: AdminNotificationData): Promise<boolean> => {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'mayanikfit@gmail.com';

  // Validate admin email
  if (!adminEmail || !isValidEmail(adminEmail)) {
    console.error('Invalid admin email configuration:', adminEmail);
    return false;
  }
  
  // Get email configuration
  const config = {
    provider: (import.meta.env.VITE_EMAIL_PROVIDER as string) || 'sendgrid',
    apiKey: import.meta.env.VITE_EMAIL_API_KEY || SENDGRID_API_KEY,
    fromEmail: import.meta.env.VITE_EMAIL_FROM || 'noreply@axiasi.com',
    fromName: 'AXI ASI LAB Admin System'
  };

  console.log('Sending admin notification to:', adminEmail);

  if (!config.apiKey) {
    console.log('📧 DEVELOPMENT MODE: Admin notification would be sent to', adminEmail);
    console.log('User data:', userData);
    return true;
  }

  try {
    const template = getAdminNotificationTemplate(userData);
    
    if (config.provider === 'sendgrid') {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: adminEmail }],
            subject: template.subject
          }],
          from: {
            email: config.fromEmail,
            name: config.fromName
          },
          content: [
            {
              type: 'text/plain',
              value: template.text
            },
            {
              type: 'text/html',
              value: template.html
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Admin notification failed:', error);
        return false;
      }

      console.log('✅ Admin notification sent successfully to', adminEmail);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return false;
  }
};

// Enhanced user data collection
export const collectUserData = (username: string, email: string, axiNumber: number, authType: 'web2' | 'wallet'): AdminNotificationData => {
  return {
    username,
    email,
    axiNumber,
    authType,
    registrationDate: new Date().toISOString(),
    userAgent: navigator.userAgent,
    ipAddress: 'Hidden for privacy' // In production, you might get this from a service
  };
};