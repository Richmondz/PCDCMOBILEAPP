import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const { teenEmail, topic, urgency, preference, mentorName } = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Teen Club App <onboarding@resend.dev>",
        to: ["ryang@chinatown-pcdc.org"],
        cc: ["ost@chinatown-pcdc.org", "kwang@chinatown-pcdc.org"],
        subject: `[${urgency}] New Mentor Request from ${teenEmail}`,
        html: `
          <h2>New Ask a Mentor Request</h2>
          <p><strong>From:</strong> ${teenEmail}</p>
          <p><strong>Assigned Mentor:</strong> ${mentorName}</p>
          <p><strong>Urgency:</strong> ${urgency}</p>
          <p><strong>Preference:</strong> ${preference}</p>
          <hr />
          <h3>Topic:</h3>
          <p>${topic}</p>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
};

serve(handler);
