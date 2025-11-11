"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { getPublicFiles, downloadFile } from "../../lib/anchorClient";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  FileText,
  ExternalLink,
  Loader2,
  HardDrive,
  TrendingUp,
} from "lucide-react";

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

export default function BrowsePage() {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const [publicFiles, setPublicFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const load = async () => {
      if (mounted) {
        setLoading(true);
        try {
          const files = await getPublicFiles(wallet);
          setPublicFiles(files);
          setFilteredFiles(files);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    load();
  }, [wallet, mounted]);

  useEffect(() => {
    if (!searchTerm.trim()) setFilteredFiles(publicFiles);
    else
      setFilteredFiles(
        publicFiles.filter((f) =>
          f.fileName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
  }, [searchTerm, publicFiles]);

  const handleDownload = async (file: FileData) => {
    if (!wallet.connected || !wallet.publicKey)
      return alert("Please connect your wallet to download files");
    try {
      await downloadFile(wallet, file.fileHash);
      const url = `https://ipfs.io/ipfs/${file.ipfsHash}`;
      window.open(url, "_blank");

      const updated = await getPublicFiles(wallet);
      setPublicFiles(updated);
      setFilteredFiles(updated);
    } catch (err) {
      console.error(err);
      const url = `https://ipfs.io/ipfs/${file.ipfsHash}`;
      window.open(url, "_blank");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070708]">
        <Loader2 className="w-12 h-12 animate-spin text-violet-400" />
      </div>
    );
  }

  const stats = [
    { icon: FileText, label: "Total Files", value: publicFiles.length },
    {
      icon: HardDrive,
      label: "Total Size",
      value: formatFileSize(publicFiles.reduce((s, f) => s + f.fileSize, 0)),
    },
    {
      icon: TrendingUp,
      label: "Downloads",
      value: publicFiles.reduce((s, f) => s + f.accessCount, 0),
    },
  ];

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
            <h1 className="text-3xl font-extrabold">Browse Public Files</h1>
            <p className="text-sm text-zinc-400">
              Discover and download files shared by others
            </p>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <div className="text-sm text-zinc-400">{s.label}</div>
                <div className="mt-1 text-2xl font-semibold">{s.value}</div>
              </div>
              <div className="p-3 rounded-md bg-gradient-to-br from-purple-600 to-indigo-500">
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* search */}
        <div className="mb-6 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[rgba(255,255,255,0.01)] border border-zinc-800 text-slate-100 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* files grid */}
        {loading ? (
          <div className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-[rgba(255,255,255,0.02)] border border-zinc-800 rounded-2xl p-6 text-center text-zinc-400">
            No public files found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((f, i) => (
              <motion.div
                key={f.fileHash}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
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
                      <div>
                        {new Date(
                          f.uploadTimestamp * 1000
                        ).toLocaleDateString()}
                      </div>
                      <div className="mt-1">{f.accessCount} views</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-zinc-500 truncate">
                    By {f.owner}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(f)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  >
                    <Download className="w-4 h-4" />{" "}
                    {wallet.connected ? "Download" : "Connect"}
                  </button>

                  {!wallet.connected && (
                    <a
                      href={`https://ipfs.io/ipfs/${f.ipfsHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
