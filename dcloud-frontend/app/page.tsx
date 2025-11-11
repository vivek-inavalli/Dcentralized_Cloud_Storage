"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { initializeStorage, storageAccountExists } from "../lib/anchorClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  CheckCircle,
  Wallet,
  Zap,
  Loader2,
  AlertTriangle,
  FileText,
} from "lucide-react";

// --- Animation Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.45, ease: "easeOut" },
  }),
};

// --- Elegant Card Component ---
const SoftCard = ({ children, className = "" }) => (
  <motion.div
    variants={fadeUp}
    className={`w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

export default function HomePage() {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [storageExists, setStorageExists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Check storage status
  useEffect(() => {
    const verify = async () => {
      if (wallet.connected && wallet.publicKey) {
        try {
          const exists = await storageAccountExists(wallet, wallet.publicKey);
          setStorageExists(exists);
        } catch (err) {
          console.error(err);
          setError("Unable to verify storage account. Check console.");
        }
      } else {
        setStorageExists(false);
      }
    };
    if (mounted) verify();
  }, [wallet.connected, wallet.publicKey, mounted]);

  // Handle initialize
  const handleInit = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert("Please connect your wallet first.");
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      await initializeStorage(wallet);
      setStorageExists(true);
    } catch (err: any) {
      const msg = err.message || "Failed to initialize storage.";
      if (msg.includes("already in use")) setStorageExists(true);
      else setError(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
        <p>Loading DCloud...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex flex-col items-center justify-start py-20 px-4 relative overflow-hidden">
      {/* --- Decorative Soft Gradient Circles --- */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-blue-100 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[280px] h-[280px] bg-purple-100 rounded-full blur-[100px]" />

      {/* --- HEADER --- */}
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center mb-16"
      >
        <div className="flex items-center justify-center mb-4">
          <Cloud className="h-10 w-10 text-blue-500 mr-2" />
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900">
            DCloud
          </h1>
        </div>
        <p className="text-gray-600 text-lg max-w-md mx-auto">
          Decentralized file storage, powered by{" "}
          <span className="font-semibold text-blue-600">Solana</span> &{" "}
          <span className="font-semibold text-purple-600">IPFS</span>.
        </p>
      </motion.header>

      {/* --- WALLET CARD --- */}
      <SoftCard>
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center justify-center gap-2">
          <Wallet className="h-5 w-5 text-blue-500" />
          Step 1: Connect Wallet
        </h2>

        <div className="flex justify-center mb-6">
          <WalletMultiButton className="!bg-blue-600 !hover:bg-blue-700 !text-white !rounded-full !py-3 !px-8 !font-semibold shadow-md transition-all" />
        </div>

        <AnimatePresence mode="wait">
          {wallet.connected && wallet.publicKey ? (
            <motion.div
              key="wallet-connected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center"
            >
              <p className="flex items-center justify-center gap-2 font-semibold">
                <CheckCircle className="h-5 w-5" />
                Wallet Connected
              </p>
              <p className="mt-1 text-xs text-gray-600 font-mono">
                {wallet.publicKey.toBase58().slice(0, 6)}...
                {wallet.publicKey.toBase58().slice(-6)}
              </p>
            </motion.div>
          ) : (
            <p className="text-gray-500 text-center">
              Connect your wallet to get started.
            </p>
          )}
        </AnimatePresence>
      </SoftCard>

      {/* --- STORAGE CARD --- */}
      <AnimatePresence mode="wait">
        {wallet.connected && wallet.publicKey && (
          <SoftCard className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Step 2: Storage Account
            </h2>

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {error}
              </motion.div>
            )}

            {storageExists ? (
              <motion.div
                key="storage-ready"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-green-600 font-semibold text-lg mb-3 flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Storage Ready
                </p>
                <p className="text-gray-600 mb-5">
                  Your decentralized storage account is active.
                </p>
                <button
                  disabled
                  className="w-full bg-gray-100 border border-gray-300 text-gray-500 py-3 rounded-lg font-medium cursor-not-allowed"
                >
                  DCloud File Manager (Coming Soon)
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="storage-init"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <p className="text-gray-600 mb-6">
                  A one-time Solana transaction will create your storage
                  account.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleInit}
                  disabled={isInitializing}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="h-5 w-5 inline-block animate-spin mr-2" />
                      Processing Transaction...
                    </>
                  ) : (
                    "Initialize Storage"
                  )}
                </motion.button>
              </motion.div>
            )}
          </SoftCard>
        )}
      </AnimatePresence>

      {/* --- FOOTER --- */}
      <motion.footer
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-gray-500 text-sm mt-16 text-center"
      >
        <p className="mb-2">© 2025 DCloud • Built on Solana</p>
        <a
          href="https://docs.dcloud.example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 transition font-medium"
        >
          <FileText className="h-4 w-4 inline-block mr-1" />
          View Documentation
        </a>
      </motion.footer>
    </div>
  );
}
