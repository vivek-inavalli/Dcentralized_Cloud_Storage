"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { uploadFile, storageAccountExists } from "../../lib/anchorClient";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, UploadCloud, Loader2 } from "lucide-react";

export default function UploadPage() {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasStorageAccount, setHasStorageAccount] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const checkStorage = async () => {
      if (wallet.connected && wallet.publicKey && mounted) {
        setCheckingStorage(true);
        try {
          const exists = await storageAccountExists(wallet, wallet.publicKey);
          setHasStorageAccount(exists);
        } catch {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!wallet.connected) return alert("Please connect your wallet first");
    if (!wallet.publicKey) return alert("Wallet publicKey not available");
    if (!hasStorageAccount)
      return alert(
        "Please initialize your storage account first from the home page"
      );
    if (!file) return alert("Please select a file to upload");

    setUploading(true);
    try {
      const fileHash = await createUniqueFileHash(file);
      const ipfsHash = "QmPlaceholderHashForDemo" + Date.now();

      await uploadFile(wallet, fileHash, file.name, file.size, ipfsHash, null);

      alert("File uploaded successfully!");
      setFile(null);
      const fi = document.getElementById(
        "file-input"
      ) as HTMLInputElement | null;
      if (fi) fi.value = "";
    } catch (err) {
      console.error(err);
      alert(`Upload failed: ${String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const createUniqueFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const ts = Date.now().toString();
    return `${hex.slice(0, 24)}${ts.slice(-8)}`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0d]">
        <Loader2 className="w-12 h-12 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070708] text-slate-100">
      {/* Topbar */}
      <header className="w-full bg-[rgba(255,255,255,0.02)] border-b border-zinc-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-gradient-to-br from-purple-600 to-indigo-500 shadow-sm">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div className="text-lg font-semibold tracking-tight">DCloud</div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/upload"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 shadow hover:brightness-105"
            >
              <UploadCloud className="w-4 h-4" /> Upload
            </a>

            <WalletMultiButton className="!bg-transparent !border !border-zinc-700 !text-slate-100 !py-2 !px-4 !rounded-md" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* left: upload card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-6 shadow-sm backdrop-blur-md"
          >
            <h2 className="text-xl font-semibold mb-2">Upload to DCloud</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Files are stored on IPFS and metadata kept on-chain. Keep wallet
              connected while uploading.
            </p>

            <label className="block text-sm text-zinc-300 mb-2">
              Select file
            </label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              className="w-full text-sm text-zinc-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-zinc-800 file:text-sm file:text-slate-100 hover:file:brightness-105"
            />

            <AnimatePresence>
              {file && (
                <motion.div
                  key="meta"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-4 p-3 rounded-md bg-[rgba(255,255,255,0.01)] border border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-xs text-zinc-400">
                        {(file.size / 1024).toFixed(1)} KB •{" "}
                        {file.type || "Unknown"}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">Ready</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Upload File"
              )}
            </button>

            <div className="mt-4 text-sm text-zinc-400">
              {checkingStorage ? (
                <div>Checking storage account...</div>
              ) : hasStorageAccount ? (
                <div className="text-emerald-400">Storage account ready</div>
              ) : (
                <div className="text-amber-400">
                  Storage account not found — initialize on Home
                </div>
              )}
            </div>
          </motion.div>

          {/* right: two helper panels */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-2">Upload Tips</h3>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li>
                  • Transactions may take a few seconds to confirm on Solana.
                </li>
                <li>
                  • IPFS hashes are used to fetch files from distributed nodes.
                </li>
                <li>
                  • This demo uses placeholder IPFS hashes for quick testing.
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
              <p className="text-sm text-zinc-400">
                Uploaded files will become visible in “My Storage” once the
                transaction confirms on-chain.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
