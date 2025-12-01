import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">MenuQR</h1>
        <p className="text-gray-600 mb-8">Digital Menu System</p>
        <div className="space-x-4">
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
