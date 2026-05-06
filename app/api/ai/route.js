export async function POST(req) {
  const { prompt } = await req.json();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a math assistant. Return only final answer and short explanation.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();

  const answer = data.choices[0].message.content;

  return Response.json({ answer });
}