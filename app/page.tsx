import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">MenuQR</h1>
        <p className="text-muted mb-8">Digital Menu System</p>
        <div className="space-x-4">
          <Link href="/auth/login" className="btn-primary">
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-150 active:scale-95"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
