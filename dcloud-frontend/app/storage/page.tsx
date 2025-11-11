"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import {
  storageAccountExists,
  getStorageInfo,
  getUserFiles,
  deleteFile,
  shareFile,
} from "../../lib/anchorClient";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Trash2, Share2, Loader2 } from "lucide-react";

interface FileData {
  publicKey: string;
  owner: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
  ipfsHash: string;
  encryptionKey: string | null;
  uploadTimestamp: number;
  isPublic: boolean;
  accessCount: number;
  bump: number;
}

export default function StoragePage() {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const [hasStorageAccount, setHasStorageAccount] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const load = async () => {
      if (wallet.connected && wallet.publicKey && mounted) {
        setLoading(true);
        try {
          const exists = await storageAccountExists(wallet, wallet.publicKey);
          setHasStorageAccount(exists);
          if (exists) {
            const info = await getStorageInfo(wallet, wallet.publicKey);
            setStorageInfo(info);
            const userFiles = await getUserFiles(wallet, wallet.publicKey);
            setFiles(userFiles);
          }
        } catch (err) {
          console.error(err);
          setHasStorageAccount(false);
        } finally {
          setLoading(false);
        }
      } else {
        setHasStorageAccount(false);
        setStorageInfo(null);
        setFiles([]);
      }
    };
    load();
  }, [wallet.connected, wallet.publicKey, mounted]);

  const handleDeleteFile = async (fileHash: string, fileName: string) => {
    if (!wallet.connected || !wallet.publicKey)
      return alert("Wallet not connected");
    if (!confirm(`Delete "${fileName}"?`)) return;

    try {
      await deleteFile(wallet, fileHash);
      const userFiles = await getUserFiles(wallet, wallet.publicKey);
      setFiles(userFiles);
      const info = await getStorageInfo(wallet, wallet.publicKey);
      setStorageInfo(info);
    } catch (err: any) {
      console.error(err);
      alert(`Error deleting file: ${err?.message ?? String(err)}`);
    }
  };

  const handleShareFile = async (
    fileHash: string,
    fileName: string,
    makePublic: boolean
  ) => {
    if (!wallet.connected || !wallet.publicKey)
      return alert("Wallet not connected");
    try {
      await shareFile(wallet, fileHash, makePublic);
      const userFiles = await getUserFiles(wallet, wallet.publicKey);
      setFiles(userFiles);
    } catch (err: any) {
      console.error(err);
      alert(`Error updating visibility: ${err?.message ?? String(err)}`);
    }
  };

  const downloadFromIPFS = (ipfsHash: string) => {
    const a = document.createElement("a");
    a.href = `https://ipfs.io/ipfs/${ipfsHash}`;
    a.download = ipfsHash;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024,
      sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070708]">
        <Loader2 className="w-12 h-12 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070708] text-slate-100">
      {/* Topbar */}
      <header className="w-full bg-[rgba(255,255,255,0.02)] border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-gradient-to-br from-purple-600 to-indigo-500">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-lg font-semibold">DCloud</div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/upload"
              className="px-3 py-2 rounded-md text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              Upload
            </a>
            <WalletMultiButton className="!bg-transparent !border !border-zinc-700 !text-slate-100 !py-2 !px-4 !rounded-md" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold">My Storage</h1>
            <p className="text-sm text-zinc-400">Manage and share your files</p>
          </div>
        </div>

        {/* overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-5">
            <div className="text-sm text-zinc-400">Total Files</div>
            <div className="mt-2 text-2xl font-semibold">
              {storageInfo?.totalFiles ?? 0}
            </div>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-5">
            <div className="text-sm text-zinc-400">Storage Used</div>
            <div className="mt-2 text-2xl font-semibold">
              {storageInfo
                ? formatFileSize(Number(storageInfo.totalStorageUsed))
                : "0 B"}
            </div>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-5">
            <div className="text-sm text-zinc-400">Owner</div>
            <div className="mt-2 text-xs font-mono break-all">
              {storageInfo?.owner ??
                (wallet.publicKey ? wallet.publicKey.toString() : "—")}
            </div>
          </div>
        </div>

        {/* files grid */}
        {loading ? (
          <div className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
          </div>
        ) : files.length === 0 ? (
          <div className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-6 text-center text-zinc-400">
            No files yet — upload from the button above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((f) => (
              <motion.div
                key={f.fileHash}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div
                        className="font-semibold text-slate-100 truncate max-w-xs"
                        title={f.fileName}
                      >
                        {f.fileName}
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
                        {formatFileSize(f.fileSize)}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400 text-right">
                      <div>{formatDate(f.uploadTimestamp)}</div>
                      <div className="mt-1">{f.accessCount} views</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-zinc-500 break-all">
                    <span className="font-mono text-zinc-400">IPFS: </span>
                    <span className="text-zinc-300">
                      {f.ipfsHash.slice(0, 8)}...{f.ipfsHash.slice(-6)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => downloadFromIPFS(f.ipfsHash)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>

                  <button
                    onClick={() =>
                      handleShareFile(f.fileHash, f.fileName, !f.isPublic)
                    }
                    className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteFile(f.fileHash, f.fileName)}
                    className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
