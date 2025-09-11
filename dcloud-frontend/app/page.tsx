"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { initializeStorage, storageAccountExists } from "../lib/anchorClient";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const wallet = useWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [storageExists, setStorageExists] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkStorageAccount = async () => {
      setError(null);
      if (wallet.connected && wallet.publicKey) {
        try {
          const exists = await storageAccountExists(wallet, wallet.publicKey);
          setStorageExists(exists);
          setStorageInitialized(exists);
        } catch (error: any) {
          setError("Failed to check storage account. Please try again.");
          setStorageExists(false);
          setStorageInitialized(false);
        }
      } else {
        setStorageExists(false);
        setStorageInitialized(false);
      }
    };

    if (mounted) checkStorageAccount();
  }, [wallet.connected, wallet.publicKey, mounted]);

  const handleInit = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      await initializeStorage(wallet);
      setStorageInitialized(true);
      setStorageExists(true);
    } catch (error: any) {
      if (error.message?.includes("already in use")) {
        setStorageExists(true);
        setStorageInitialized(true);
      } else {
        setError(error.message || "Failed to initialize storage.");
      }
    } finally {
      setIsInitializing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 text-lg"
        >
          Loading...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex flex-col items-center py-10 px-4 sm:px-6">
      {/* Header */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl text-center mb-8"
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
          DCloud <span className="text-blue-600">–</span> Decentralized Cloud
          Storage
        </h1>
        <p className="text-lg text-gray-600">
          Store and share files securely on{" "}
          <span className="font-semibold text-blue-700">Solana</span> +{" "}
          <span className="font-semibold text-purple-700">IPFS</span>
        </p>
      </motion.header>

      <div className="w-full flex flex-col items-center gap-8">
        {/* Wallet Connection Card */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Wallet Connection
          </h2>
          <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition duration-300 mb-4" />

          <AnimatePresence>
            {wallet.connected && wallet.publicKey ? (
              <motion.div
                key="wallet-connected"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center w-full"
              >
                <p className="text-green-600 font-semibold text-lg flex items-center justify-center gap-2">
                  <span className="animate-pulse">●</span> Wallet Connected
                </p>
                <p className="text-xs text-gray-600 break-all mt-1">
                  {wallet.publicKey.toString()}
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="wallet-disconnected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-500"
              >
                Connect your wallet to proceed
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Storage Account Card */}
        <AnimatePresence>
          {wallet.connected && wallet.publicKey && (
            <motion.section
              key="storage-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Storage Account
              </h2>

              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm w-full text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {storageExists ? (
                  <motion.div
                    key="storage-ready"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center w-full"
                  >
                    <p className="text-green-600 font-semibold text-lg mb-4 flex items-center justify-center gap-2">
                      <span className="animate-pulse">●</span> Storage Account
                      Ready
                    </p>
                    <p className="text-gray-600">
                      Your storage account is ready to store and share files
                      securely.
                    </p>
                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl text-gray-500 border border-dashed border-blue-200 shadow-inner">
                      <span className="block text-lg font-semibold text-blue-700 mb-2">
                        🚀 Coming Soon
                      </span>
                      <span>
                        File upload & sharing features will appear here.
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="storage-init"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center w-full"
                  >
                    <p className="text-gray-600 mb-4">
                      Initialize your storage account to start uploading files.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleInit}
                      disabled={isInitializing}
                      className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
                    >
                      {isInitializing
                        ? "Initializing..."
                        : "Initialize Storage"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Docs */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="w-full max-w-2xl mx-auto mt-10 text-center text-sm text-gray-500"
      >
        <a
          href="https://docs.dcloud.example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-600 transition"
        >
          Read Documentation
        </a>
      </motion.footer>
    </div>
  );
}
