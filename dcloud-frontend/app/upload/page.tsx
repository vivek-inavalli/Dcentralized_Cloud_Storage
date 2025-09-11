"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { uploadFile, storageAccountExists } from "../../lib/anchorClient";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadPage() {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasStorageAccount, setHasStorageAccount] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(false);

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user has storage account when wallet connects
  useEffect(() => {
    const checkStorage = async () => {
      if (wallet.connected && wallet.publicKey && mounted) {
        setCheckingStorage(true);
        try {
          const exists = await storageAccountExists(wallet, wallet.publicKey);
          setHasStorageAccount(exists);
        } catch (error) {
          setHasStorageAccount(false);
        } finally {
          setCheckingStorage(false);
        }
      } else {
        setHasStorageAccount(false);
      }
    };

    checkStorage();
  }, [wallet.connected, wallet.publicKey, mounted]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!wallet.connected) {
      alert("Please connect your wallet first");
      return;
    }
    if (!wallet.publicKey) {
      alert("Wallet publicKey not available");
      return;
    }
    if (!hasStorageAccount) {
      alert("Please initialize your storage account first from the home page");
      return;
    }
    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    setUploading(true);

    try {
      const fileHash = await createUniqueFileHash(file);
      const ipfsHash = "QmPlaceholderHashForDemo" + Date.now();

      await uploadFile(
        wallet,
        fileHash,
        file.name,
        file.size,
        ipfsHash,
        null // No encryption for demo
      );

      alert("File uploaded successfully!");
      setFile(null);
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      alert(`Upload failed: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const createUniqueFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const timestamp = Date.now().toString();
    return `${hexHash.slice(0, 24)}${timestamp.slice(-8)}`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Files
          </h1>
          <p className="text-lg text-gray-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-10 px-4 flex flex-col items-center">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl text-center mb-8"
      >
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
          Upload Files
        </h1>
        <p className="text-lg text-gray-600">
          Upload your files to decentralized storage
        </p>
      </motion.div>

      <div className="w-full flex flex-col items-center gap-8">
        {/* Wallet Connection Card */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Wallet Connection
          </h2>
          <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 mb-4" />

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

        {/* Storage Account Status Card */}
        {wallet.connected && wallet.publicKey && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Storage Account Status
            </h2>
            {checkingStorage ? (
              <div className="text-center">
                <p className="text-blue-600 font-semibold">
                  Checking storage account...
                </p>
              </div>
            ) : hasStorageAccount ? (
              <div className="text-center">
                <p className="text-green-600 font-semibold">
                  ✅ Storage Account Ready
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-yellow-600 font-semibold mb-2">
                  ⚠️ Storage Account Not Found
                </p>
                <p className="text-gray-600 mb-4">
                  Please initialize your storage account first
                </p>
                <a
                  href="/"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Go to Home Page to Initialize
                </a>
              </div>
            )}
          </motion.section>
        )}

        {/* File Upload Card */}
        {wallet.connected && wallet.publicKey && hasStorageAccount && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload File
            </h2>
            <div className="w-full space-y-4">
              {/* File Input */}
              <div>
                <label
                  htmlFor="file-input"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select File
                </label>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* File Info */}
              <AnimatePresence>
                {file && (
                  <motion.div
                    key="file-info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 bg-gray-50 rounded"
                  >
                    <h3 className="font-semibold text-gray-700 mb-2">
                      File Details:
                    </h3>
                    <p className="text-sm text-gray-600">Name: {file.name}</p>
                    <p className="text-sm text-gray-600">
                      Size: {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-sm text-gray-600">
                      Type: {file.type || "Unknown"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Button */}
              <motion.button
                whileHover={{ scale: file && !uploading ? 1.03 : 1 }}
                whileTap={{ scale: file && !uploading ? 0.97 : 1 }}
                onClick={handleUpload}
                disabled={
                  uploading || !file || !wallet.connected || !hasStorageAccount
                }
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </motion.button>

              {/* Upload Status */}
              <AnimatePresence>
                {uploading && (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-blue-600"
                  >
                    <p>📤 Uploading file to blockchain...</p>
                    <p className="text-sm text-gray-600">
                      This may take a few seconds
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}

        {/* Instructions for unconnected users */}
        {!wallet.connected && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full max-w-md bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center text-center"
          >
            <h2 className="text-xl font-semibold mb-4">Get Started</h2>
            <p className="text-gray-600 mb-4">
              Connect your wallet to start uploading files to decentralized
              storage
            </p>
          </motion.section>
        )}
      </div>
    </div>
  );
}
