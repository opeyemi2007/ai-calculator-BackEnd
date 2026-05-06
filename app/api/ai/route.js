export async function POST(req) {
  try {
    const { prompt } = await req.json();

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
          messages: [
            {
              role: "system",
              content:
                "You are a helpful math assistant.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    return new Response(
      JSON.stringify({
        answer:
          data ||
          "No response",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",

          // ✅ CORS FIX
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        answer: "Server Error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

/* ✅ HANDLE PREFLIGHT REQUESTS */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type",
    },
  });
}