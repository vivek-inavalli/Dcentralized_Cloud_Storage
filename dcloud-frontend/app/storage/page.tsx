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
    const loadStorageData = async () => {
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
        } catch (error) {
          console.error("Error loading storage data:", error);
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

    loadStorageData();
  }, [wallet.connected, wallet.publicKey, mounted]);

  const handleDeleteFile = async (fileHash: string, fileName: string) => {
    if (!wallet.connected || !wallet.publicKey)
      return alert("Wallet not connected");
    if (!confirm(`Delete \"${fileName}\"?`)) return;

    try {
      await deleteFile(wallet, fileHash);
      const userFiles = await getUserFiles(wallet, wallet.publicKey);
      setFiles(userFiles);
      const info = await getStorageInfo(wallet, wallet.publicKey);
      setStorageInfo(info);
    } catch (error: any) {
      console.error("Error deleting file:", error);
      alert(`Error deleting file: ${error.message}`);
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
    } catch (error: any) {
      console.error("Error sharing file:", error);
      alert(`Error updating visibility: ${error.message}`);
    }
  };

  // const downloadFromIPFS = (ipfsHash: string) => {
  //   window.open(`https://ipfs.io/ipfs/${ipfsHash}`, "_blank");
  // };

  const downloadFromIPFS = (ipfsHash: string) => {
    const link = document.createElement("a");
    link.href = `https://ipfs.io/ipfs/${ipfsHash}`;
    link.download = ipfsHash; // suggested filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024,
      sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-12">
      <div className="max-w-6xl mx-auto px-6 space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-600 bg-clip-text text-transparent mb-3">
            My Storage
          </h1>
          <p className="text-lg text-gray-700">
            A colorful way to manage your decentralized files
          </p>
        </div>

        {/* Wallet */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl shadow-md border border-blue-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-indigo-800">Wallet</h2>
            {wallet.connected && (
              <span className="flex items-center text-green-600 text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Connected
              </span>
            )}
          </div>
          <div className="flex flex-col items-center space-y-4">
            <WalletMultiButton className="!bg-gradient-to-r !from-pink-500 !to-purple-600 hover:!from-pink-600 hover:!to-purple-700 !rounded-lg !px-6 !py-2.5 !font-semibold !text-white" />
            {wallet.connected && wallet.publicKey && (
              <p className="text-xs font-mono bg-white px-3 py-2 rounded border border-pink-200 text-purple-700 break-all">
                {wallet.publicKey.toString()}
              </p>
            )}
          </div>
        </div>

        {/* Storage Info */}
        {wallet.connected && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl shadow-md border border-green-200 p-6">
            <h2 className="text-lg font-bold text-emerald-800 mb-4">
              Account Overview
            </h2>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : hasStorageAccount && storageInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-gradient-to-br from-pink-100 to-pink-200 border border-pink-300">
                  <p className="text-sm text-pink-700">Total Files</p>
                  <p className="text-2xl font-bold text-pink-900">
                    {storageInfo.totalFiles?.toString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-300">
                  <p className="text-sm text-yellow-700">Storage Used</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {formatFileSize(Number(storageInfo.totalStorageUsed))}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-200 border border-purple-300">
                  <p className="text-sm text-purple-700">Owner</p>
                  <p className="text-sm font-mono text-indigo-900 truncate">
                    {storageInfo.owner?.toString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm">No storage account found.</p>
            )}
          </div>
        )}

        {/* Files */}
        {wallet.connected && hasStorageAccount && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-100 rounded-2xl shadow-md border border-purple-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-purple-800">Your Files</h2>
              <a
                href="/upload"
                className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-600 text-white text-sm rounded-lg shadow hover:from-green-500 hover:to-emerald-700"
              >
                Upload File
              </a>
            </div>

            {files.length === 0 ? (
              <p className="text-gray-600 text-sm">No files uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead>
                    <tr className="bg-gradient-to-r from-pink-200 to-purple-200 text-gray-900">
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Uploaded</th>
                      <th className="py-2 px-3">Visibility</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-pink-50" : "bg-purple-50"}
                      >
                        <td className="py-2 px-3 font-medium text-gray-900">
                          {file.fileName}
                        </td>
                        <td className="py-2 px-3">
                          {formatFileSize(file.fileSize)}
                        </td>
                        <td className="py-2 px-3">
                          {formatDate(file.uploadTimestamp)}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              file.isPublic
                                ? "bg-lime-200 text-lime-800"
                                : "bg-amber-200 text-amber-800"
                            }`}
                          >
                            {file.isPublic ? "Public" : "Private"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right space-x-2">
                          <button
                            onClick={() => downloadFromIPFS(file.ipfsHash)}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600"
                          >
                            Download
                          </button>
                          <button
                            onClick={() =>
                              handleShareFile(
                                file.fileHash,
                                file.fileName,
                                !file.isPublic
                              )
                            }
                            className="px-3 py-1.5 bg-fuchsia-500 text-white rounded-lg text-xs hover:bg-fuchsia-600"
                          >
                            {file.isPublic ? "Make Private" : "Make Public"}
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteFile(file.fileHash, file.fileName)
                            }
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
