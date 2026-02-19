"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <h1 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h1>
      <p className="text-neutral-400 text-sm font-mono max-w-lg mb-4 break-all">
        {error.message}
      </p>
      {error.digest && (
        <p className="text-neutral-500 text-xs mb-4">Digest: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-neutral-700 px-4 py-2 text-white hover:bg-neutral-600 transition"
      >
        Try again
      </button>
    </div>
  );
}
