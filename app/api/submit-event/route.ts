import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Insert into event_submissions table (pending approval)
    const { data, error } = await supabase
      .from('event_submissions')
      .insert([
        {
          title: body.title,
          event_date: body.event_date,
          time: body.time || null,
          location: body.location,
          event_type: body.event_type,
          subtype_1: body.subtype_1 || null,
          subtype_2: body.subtype_2 || null,
          subtype_3: body.subtype_3 || null,
          neighborhood: body.neighborhood || null,
          pricing_type: body.pricing_type,
          description: body.description || null,
          image_url: body.image_url || null,
          price: body.price || null,
          instagram_url: body.instagram_url || null,
          insider_tip: body.insider_tip || null,
          organizer_name: body.organizer_name,
          organizer_email: body.organizer_email,
          organizer_phone: body.organizer_phone || null,
          organizer_instagram: body.organizer_instagram || null,
          status: 'pending',
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}