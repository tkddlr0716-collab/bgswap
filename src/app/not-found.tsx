import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-block w-full sm:w-auto bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Back to home
        </Link>
        <Link
          href="/upload"
          className="inline-block w-full sm:w-auto bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
        >
          Upload a photo
        </Link>
      </div>
    </main>
  );
}
