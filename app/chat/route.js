import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const systemPrompt = `...`;

export async function POST(req) {
  try {
    const data = await req.json();

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
    const index = pc.index('rag').namespace('ns1');

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const text = data[data.length - 1].content;

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    const embedding = embeddingResponse.data[0].embedding;

    const results = await index.query({
      topK: 3,
      includeMetadata: true,
      vector: embedding,
    });

    let resultString = '...'; // Construct your result string as needed

    const messages = [
      { role: 'system', content: systemPrompt },
      ...data,
      { role: 'user', content: text + resultString },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
