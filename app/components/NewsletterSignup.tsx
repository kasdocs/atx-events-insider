'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NewsletterSignup({ source = 'homepage' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

// Check if email already exists
const { data: existing, error: checkError } = await supabase
  .from('newsletter_subscribers')
  .select('email')
  .eq('email', email.toLowerCase())
  .maybeSingle();

if (existing) {
  setStatus('error');
  setMessage('You\'re already subscribed! 🎉');
  return;
}

    // Add to Supabase
    const { error: supabaseError } = await supabase
      .from('newsletter_subscribers')
      .insert([
        { 
          email: email.toLowerCase(), 
          source: source,
          active: true
        }
      ]);

    if (supabaseError) {
      console.error('Newsletter signup error:', supabaseError);
      setStatus('error');
      setMessage(supabaseError.message || 'Oops! Something went wrong. Please try again.');
      return;
    }

    // Sync to ConvertKit
    try {
      const ckResponse = await fetch('/api/convertkit/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), source }),
      });

      if (!ckResponse.ok) {
        console.error('ConvertKit sync failed, but subscriber saved to Supabase');
      }
    } catch (error) {
      console.error('ConvertKit sync error:', error);
      // Don't show error to user - they're still subscribed in our database
    }

    setStatus('success');
    setMessage('🎉 Thanks for subscribing! Check your inbox for updates.');
    setEmail('');
    
    // Reset after 5 seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-orange-50 p-6 rounded-xl border border-gray-200">
      <h3 className="text-xl font-bold mb-2" style={{color: '#FF006E'}}>
        💌 Newsletter
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Get the best Austin events delivered to your inbox every week!
      </p>
      
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'success'}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
        />
        
        <button 
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{backgroundColor: '#FF006E'}}
        >
          {status === 'loading' ? 'Subscribing...' : status === 'success' ? '✓ Subscribed!' : 'Subscribe'}
        </button>
      </form>
      
      {message && (
        <p className={`text-xs mt-3 text-center font-semibold ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
      
      {status !== 'success' && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Free events • No spam • Unsubscribe anytime
        </p>
      )}
    </div>
  );
}