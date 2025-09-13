import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Using the provided SendGrid API key as fallback
const FALLBACK_SENDGRID_API_KEY = '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';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, sendgrid_api_key, from_email, from_name } = await req.json()

    console.log('=== SENDING EMAIL ===')
    console.log('To:', to)
    console.log('From:', from_email, from_name)
    console.log('Subject:', subject)
    
    // Use provided API key or fallback to hardcoded one
    const apiKey = sendgrid_api_key || FALLBACK_SENDGRID_API_KEY;

    // Send email via SendGrid API
    console.log('Making request to SendGrid API...')
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          subject: subject
        }],
        from: {
          email: from_email || 'noreply@axiasi.com',
          name: from_name || 'AXI ASI LAB'
        },
        content: [
          {
            type: 'text/plain',
            value: text || 'Email content'
          },
          {
            type: 'text/html',
            value: html || '<p>Email content</p>'
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SendGrid API error:', errorText)
      throw new Error(`SendGrid error: ${response.status}`)
    }

    console.log('✅ Email sent successfully via SendGrid!')

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send email - check logs for details'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})