import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/minecraft/uuid?username={minecraft_username}
 * Fetch Minecraft UUID from Mojang API (server-side to avoid CORS)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 16) {
      return NextResponse.json(
        { error: 'Invalid username length' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
    }

    // Fetch from Mojang API
    const response = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${username}`,
      {
        cache: 'no-store',
        headers: {
          'User-Agent': 'VonixNetwork/2.0',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Player not found', exists: false },
          { status: 404 }
        );
      }

      console.error(`Mojang API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch from Mojang API' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format UUID with dashes
    const uuid = data.id;
    let formattedUuid = uuid;
    
    if (uuid && uuid.length === 32) {
      formattedUuid = `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
    }

    return NextResponse.json({
      username: data.name, // Mojang returns the correct capitalization
      uuid: formattedUuid,
      exists: true,
    });

  } catch (error) {
    console.error('Error fetching Minecraft UUID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
