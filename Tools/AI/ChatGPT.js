export async function ChatGPT(model, key, text) {
    const url = `https://api.openai.com/v1/chat/completions`

    const response =await fetch(url, {
        method: "POST",
        headers: JSON.stringify({
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        }),
        body: JSON.stringify({
            model: model,
            messages: [
                { 
                    role: "user",
                    content: text
                }
            ]
        })
    });

    const json= await response.json();
    return result.choices[0].message.content;
}
