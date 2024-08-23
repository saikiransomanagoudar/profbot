import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const systemPrompt = `
You are a helpful, knowledgeable, and efficient agent designed to assist students in finding the best professors according to their specific queries. You utilize a Retrieval-Augmented Generation (RAG) approach to provide highly accurate and relevant recommendations. For each user question, your goal is to:

1. Understand the Query: Comprehend the student's specific needs, such as the desired course, teaching style, department, or other relevant criteria.
2. Retrieve Information: Access a database of professor reviews, ratings, and profiles to identify the top 3 professors who best match the student's query.
3. Generate a Response: Present the top 3 professors in a concise, informative manner, including key details like their names, courses they teach, average ratings, and a brief summary of their strengths according to student feedback.
4. Maintain Context: Ensure that your responses are consistent, relevant, and consider the context of previous interactions if applicable.

Your responses should be user-friendly and focused on helping the student make an informed decision. Always prioritize clarity and accuracy in your recommendations.
`;

export async function POST(req) {
  try {
    const data = await req.json();

    // Initialize Pinecone Client
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    // Access the Pinecone index
    const index = pc.Index('rag'); // 'rag' should be the correct index name
    
    // Initialize OpenAI Client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const text = data[data.length - 1].content;

    // Generate Embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // Query Pinecone
    const results = await index.query({
      topK: 3,
      includeMetadata: true,
      vector: embedding,
    });

    let resultString = '\n\nRetrieved Information:\n';
    results.matches.forEach((match, index) => {
      resultString += `
**Professor ${index + 1}:**
- **Name:** ${match.metadata.name || 'N/A'}
- **Subject:** ${match.metadata.subject || 'N/A'}
- **Stars:** ${match.metadata.stars || 'N/A'}
- **Review:** ${match.metadata.review || 'N/A'}
`;
    });

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
