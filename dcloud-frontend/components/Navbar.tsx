"use client";
import Link from "next/link";
import { WalletButton } from "./WalletButton";

export default function Navbar() {
  return (
    <header className="border-b border-gray-800/80">
      <div className="container-max py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          ☁ DCloud
        </Link>
        <nav className="flex gap-6 text-sm text-gray-300">
          <Link href="/upload" className="hover:text-white">
            Upload
          </Link>
          <Link href="/storage" className="hover:text-white">
            My Storage
          </Link>
        </nav>
        <WalletButton className="btn btn-primary !rounded-xl !h-10" />
      </div>
    </header>
  );
}
