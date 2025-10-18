import { NextRequest } from 'next/server';

// Server-Sent Events implementation for real-time updates
export async function GET(req: NextRequest) {
  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString()
      });

      controller.enqueue(`data: ${data}\n\n`);
    },
    cancel() {
      // Cleanup when connection closes
      console.log('SSE connection closed');
    }
  });

  return new Response(stream, { headers });
}

// POST endpoint for broadcasting messages (used by other API routes)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // For now, just return success - in a real implementation,
    // you might want to store messages and broadcast them via SSE
    return new Response(JSON.stringify({
      success: true,
      message: 'Message received for broadcasting'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
