import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // BACKEND INTEGRATION POINT: Anthropic Claude API
    // Replace with actual API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: `You are HELPxGROW AI assistant. Answer in 120 words or less. Bold key terms with **bold**. If user writes in Hindi, respond in Hindi.`,
        messages,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ content: data.content?.[0]?.text || '' });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}