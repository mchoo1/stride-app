import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Strip the data URL prefix to get raw base64
    const base64Data = image.replace(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/, '');
    const mediaType = image.match(/^data:(image\/[a-z]+);base64,/)?.[1] ?? 'image/jpeg';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Identify the food in this image and estimate its nutritional content.

Respond ONLY with a JSON object in this exact format (no markdown, no extra text):
{
  "name": "food name (be specific, e.g. 'Banana', 'Caesar Salad', 'Grilled Chicken Breast')",
  "emoji": "single relevant food emoji",
  "calories": <number per typical serving>,
  "protein": <grams per typical serving>,
  "carbs": <grams per typical serving>,
  "fat": <grams per typical serving>,
  "servingSize": "description of assumed serving size, e.g. '1 medium (118g)'",
  "confidence": <0.0 to 1.0>
}

If you cannot identify food in the image, return:
{"error": "No food detected"}`,
            },
          ],
        },
      ],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();

    // Parse JSON response
    const parsed = JSON.parse(text);

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 422 });
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error('Food scan error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
