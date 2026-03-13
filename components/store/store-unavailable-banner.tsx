'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export function StoreUnavailableBanner({ storeName }: { storeName: string }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4 text-center flex flex-col items-center gap-6 border border-gray-100">

        {/* Icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 border-2 border-red-100">
          <ShoppingBag className="h-10 w-10 text-red-400" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Store Unavailable
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            <span className="font-semibold text-gray-700">{storeName}</span> is currently closed and not accepting orders. Please check back later.
          </p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-semibold border border-red-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          Currently Unavailable
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}
