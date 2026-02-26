'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

export default function AuthDebugPage() {
  const { user, token, isLoading } = useAuth();
  const [localToken, setLocalToken] = useState<string | null>(null);

  useEffect(() => {
    setLocalToken(localStorage.getItem('token'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div>
            <p className="font-semibold">Loading State:</p>
            <p>{isLoading ? 'Loading...' : 'Loaded'}</p>
          </div>

          <div>
            <p className="font-semibold">User from Context:</p>
            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
              {user ? JSON.stringify(user, null, 2) : 'No user'}
            </pre>
          </div>

          <div>
            <p className="font-semibold">Token from Context:</p>
            <p className="bg-gray-100 p-2 rounded mt-2 text-xs break-all">
              {token || 'No token'}
            </p>
          </div>

          <div>
            <p className="font-semibold">Token from localStorage:</p>
            <p className="bg-gray-100 p-2 rounded mt-2 text-xs break-all">
              {localToken || 'No token'}
            </p>
          </div>

          <div>
            <p className="font-semibold">Tokens Match:</p>
            <p className={token === localToken ? 'text-green-600' : 'text-red-600'}>
              {token === localToken ? '✓ Yes' : '✗ No'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
