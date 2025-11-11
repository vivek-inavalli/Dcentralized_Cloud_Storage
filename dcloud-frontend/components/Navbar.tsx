"use client";
import Link from "next/link";
import { WalletButton } from "./WalletButton";

export default function Navbar() {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-extrabold text-white">
            ☁ DCloud
          </Link>

          {/* Navigation Links styled as buttons */}
          <nav className="flex space-x-4">
            <Link
              href="/upload"
              className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition"
            >
              <button>Upload</button>
            </Link>
            <Link
              href="/storage"
              className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition"
            >
              <button>Storage</button>
            </Link>
          </nav>

          {/* Wallet Button */}
          <WalletButton className="btn btn-primary rounded-lg px-4 py-2 text-sm transition hover:bg-blue-600" />
        </div>
      </div>
    </header>
  );
}
