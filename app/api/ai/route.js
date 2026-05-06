// ✅ NEW: Simple in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

export async function POST(req) {
  try {
    // ✅ FIX: Rate limiting
    const ip =
      req.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(ip)) {
      return Response.json(
        { answer: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { prompt } = await req.json();

    // ✅ FIX: Input validation
    if (
      !prompt ||
      typeof prompt !== "string" ||
      prompt.trim().length === 0
    ) {
      return Response.json(
        { answer: "Please enter a question." },
        { status: 400 }
      );
    }
    if (prompt.length > 1000) {
      return Response.json(
        { answer: "Input too long (max 1000 characters)." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          // ✅ FIX: Added max_tokens
          max_tokens: 500,
          messages: [
            {
              role: "system",
              content: "You are a helpful math assistant.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const data = await response.json();

    // ✅ FIX: Removed console.log in production
    if (process.env.NODE_ENV !== "production") {
      console.log("FULL OPENAI RESPONSE:");
      console.log(JSON.stringify(data, null, 2));
    }

    // ✅ FIX: Return 502 on OpenAI error
    if (data.error) {
      return Response.json(
        { answer: data.error.message },
        {
          status: 502,
          headers: corsHeaders(),
        }
      );
    }

    return new Response(
      JSON.stringify({
        answer:
          data.choices?.[0]?.message?.content ||
          "No response",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ answer: "Server Error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// ✅ NEW: Shared CORS helper
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}