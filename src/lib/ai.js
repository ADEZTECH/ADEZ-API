const OpenAI = require('openai');

async function generateAIResponse({ prompt, context = '' }) {
  const normalizedPrompt = String(prompt || '').trim();

  if (!normalizedPrompt) {
    throw new Error('A prompt is required.');
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      provider: 'demo',
      response: `${normalizedPrompt} — ADEZ API can power AI workflows, WhatsApp automation, and developer infrastructure for African innovation.`
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: context || 'You are a helpful AI assistant for ADEZ API.'
        },
        {
          role: 'user',
          content: normalizedPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const content = completion.choices?.[0]?.message?.content;

    return {
      provider: 'openai',
      response: content || 'No response generated.'
    };
  } catch (error) {
    console.error('OpenAI request failed:', error.message);
    return {
      provider: 'demo-fallback',
      response: `AI provider is unavailable right now. Here is a local fallback for: ${normalizedPrompt}`
    };
  }
}

module.exports = { generateAIResponse };
