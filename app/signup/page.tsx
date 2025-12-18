import { Suspense } from 'react';
import SignupContent from './SignupContent';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center px-4">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
