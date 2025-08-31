"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { uploadFile } from "@/lib/solana";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();

  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [ipfsHash, setIpfsHash] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey) return;

    setLoading(true);
    try {
      await uploadFile(
        publicKey,
        fileHash,
        fileName,
        fileSize,
        ipfsHash,
        encryptionKey ? encryptionKey : null
      );
      router.push("/files");
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-center mb-6">
            📤 Upload File
          </h1>

          {!connected ? (
            <p className="text-center text-gray-300">
              Please connect your wallet to upload a file.
            </p>
          ) : (
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  File Hash (SHA256 or similar)
                </label>
                <input
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={fileHash}
                  onChange={(e) => setFileHash(e.target.value)}
                  placeholder="Enter file hash"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  File Name
                </label>
                <input
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. myphoto.png"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  File Size (bytes)
                </label>
                <input
                  type="number"
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={fileSize}
                  onChange={(e) => setFileSize(Number(e.target.value))}
                  placeholder="e.g. 2048"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  IPFS Hash
                </label>
                <input
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={ipfsHash}
                  onChange={(e) => setIpfsHash(e.target.value)}
                  placeholder="Enter IPFS CID"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Encryption Key (optional)
                </label>
                <input
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder="Enter AES key or leave empty"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 text-lg bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload File"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
