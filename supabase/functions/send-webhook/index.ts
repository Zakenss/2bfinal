const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface WebhookPayload {
  code?: string;
  nom?: string;
  ecole?: string;
  niveau?: string;
  email?: string;
  telephone?: string;
  avance?: number;
  note?: string;
  couverture_demandee?: boolean;
  created_at?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { 
      code, 
      nom, 
      ecole, 
      niveau, 
      email, 
      telephone, 
      avance, 
      note, 
      couverture_demandee 
    } = body as WebhookPayload;

    // Prepare webhook payload with all submitted information
    const webhookPayload: WebhookPayload = {
      created_at: new Date().toISOString()
    };
    
    // Add all provided fields to the payload
    if (code && code.trim()) {
      webhookPayload.code = code.trim();
    }
    
    if (nom && nom.trim()) {
      webhookPayload.nom = nom.trim();
    }
    
    if (ecole && ecole.trim()) {
      webhookPayload.ecole = ecole.trim();
    }
    
    if (niveau && niveau.trim()) {
      webhookPayload.niveau = niveau.trim();
    }
    
    if (email && email.trim()) {
      webhookPayload.email = email.trim();
    }
    
    if (telephone && telephone.trim()) {
      webhookPayload.telephone = telephone.trim();
    }
    
    if (avance !== undefined && avance !== null) {
      webhookPayload.avance = avance;
    }
    
    if (note && note.trim()) {
      webhookPayload.note = note.trim();
    }
    
    if (couverture_demandee !== undefined) {
      webhookPayload.couverture_demandee = couverture_demandee;
    }

    // Send webhook to Make.com with new URL
    const webhookUrl = "https://hook.eu2.make.com/uq22fs5tikoc7jj1mwehrmmg42hc1lpi";
    
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      console.error("Webhook failed:", webhookResponse.status, webhookResponse.statusText);
      // Don't fail the entire request if webhook fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Form submitted successfully, webhook notification failed" 
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook sent successfully" 
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Webhook function error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});