import fetch from 'node-fetch';

const run = async () => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [{role: "user", content: "hola"}],
      temperature: 0.5,
      max_tokens: 512,
      top_p: 0.9,
    }),
    });
    console.log(await res.text());
}
run();
