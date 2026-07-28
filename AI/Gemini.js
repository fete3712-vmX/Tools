export async function Gemini(model, key, txt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        parts: [
          {
            text: `${txt}`
          }
        ]
      ]
    })
  });

  const json = await response.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text
}
