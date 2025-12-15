import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, source } = await request.json();

    console.log('=== ConvertKit Sync Attempt ===');
    console.log('Email:', email);
    console.log('Source:', source);
    console.log('Form ID:', process.env.CONVERTKIT_FORM_ID);
    console.log('API Key exists:', !!process.env.CONVERTKIT_API_KEY);

    const requestBody = {
      api_key: process.env.CONVERTKIT_API_KEY,
      email: email,
      tags: [source],
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${process.env.CONVERTKIT_FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('ConvertKit response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ConvertKit API error response:', errorText);
      return NextResponse.json({ error: 'ConvertKit sync failed', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    console.log('ConvertKit success:', data);
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}