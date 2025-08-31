"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
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

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check storage account and load data when wallet connects
  useEffect(() => {
    const loadStorageData = async () => {
      if (wallet.connected && wallet.publicKey && mounted) {
        setLoading(true);
        try {
          // Check if storage account exists
          const exists = await storageAccountExists(wallet, wallet.publicKey);
          setHasStorageAccount(exists);

          if (exists) {
            // Get storage info
            const info = await getStorageInfo(wallet, wallet.publicKey);
            setStorageInfo(info);
            console.log("Storage info:", info);

            // Get user's files
            const userFiles = await getUserFiles(wallet, wallet.publicKey);
            setFiles(userFiles);
            console.log("User files:", userFiles);
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
    if (!wallet.connected || !wallet.publicKey) {
      alert("Wallet not connected");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await deleteFile(wallet, fileHash);
      alert("File deleted successfully!");

      // Refresh the file list
      const userFiles = await getUserFiles(wallet, wallet.publicKey);
      setFiles(userFiles);

      // Refresh storage info
      const info = await getStorageInfo(wallet, wallet.publicKey);
      setStorageInfo(info);
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(`Error deleting file: ${error.message}`);
    }
  };

  const handleShareFile = async (
    fileHash: string,
    fileName: string,
    makePublic: boolean
  ) => {
    if (!wallet.connected || !wallet.publicKey) {
      alert("Wallet not connected");
      return;
    }

    try {
      await shareFile(wallet, fileHash, makePublic);
      alert(
        `"${fileName}" ${
          makePublic ? "made public" : "made private"
        } successfully!`
      );

      // Refresh the file list to show updated status
      const userFiles = await getUserFiles(wallet, wallet.publicKey);
      setFiles(userFiles);
    } catch (error) {
      console.error("Error sharing file:", error);
      alert(`Error updating file visibility: ${error.message}`);
    }
  };

  const downloadFromIPFS = (ipfsHash: string, fileName: string) => {
    // Open IPFS gateway link (you can replace with your preferred gateway)
    const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    window.open(ipfsUrl, "_blank");
  };

  // Don't render until mounted (prevents hydration errors)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              My Storage
            </h1>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Storage</h1>
          <p className="text-lg text-gray-600">
            Manage your decentralized files
          </p>
        </div>

        {/* Wallet Connection Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Wallet Connection</h2>

          <div className="flex flex-col items-center space-y-4">
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />

            {wallet.connected && wallet.publicKey && (
              <div className="text-center">
                <p className="text-green-600 font-semibold">
                  ✅ Wallet Connected
                </p>
                <p className="text-sm text-gray-600 break-all">
                  {wallet.publicKey.toString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Storage Account Status */}
        {wallet.connected && wallet.publicKey && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">
              Storage Account Status
            </h2>

            {loading ? (
              <div className="text-center">
                <p>Loading storage information...</p>
              </div>
            ) : hasStorageAccount ? (
              <div>
                <p className="text-green-600 font-semibold mb-4">
                  ✅ Storage Account Active
                </p>
                {storageInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <h3 className="font-semibold text-blue-800">
                        Total Files
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {storageInfo.totalFiles?.toString() || "0"}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <h3 className="font-semibold text-green-800">
                        Storage Used
                      </h3>
                      <p className="text-2xl font-bold text-green-600">
                        {storageInfo.totalStorageUsed
                          ? `${(
                              Number(storageInfo.totalStorageUsed) / 1024
                            ).toFixed(2)} KB`
                          : "0 KB"}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded">
                      <h3 className="font-semibold text-purple-800">
                        Account Owner
                      </h3>
                      <p className="text-sm font-mono text-purple-600 break-all">
                        {storageInfo.owner?.toString() || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
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
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Go to Home Page to Initialize
                </a>
              </div>
            )}
          </div>
        )}

        {/* File Management Section */}
        {wallet.connected && wallet.publicKey && hasStorageAccount && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Your Files</h2>
              <a
                href="/upload"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Upload New File
              </a>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No files uploaded yet</p>
                <a
                  href="/upload"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Upload Your First File
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {file.fileName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Size: {(file.fileSize / 1024).toFixed(2)} KB
                        </p>
                        <p className="text-sm text-gray-600">
                          Hash: {file.fileHash.slice(0, 16)}...
                        </p>
                        <p className="text-sm text-gray-600">
                          Uploaded:{" "}
                          {new Date(
                            file.uploadTimestamp * 1000
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Visibility: {file.isPublic ? "Public" : "Private"}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleShareFile(file.fileHash, !file.isPublic)
                          }
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Make {file.isPublic ? "Private" : "Public"}
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.fileHash)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions for unconnected users */}
        {!wallet.connected && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-gray-600 mb-4">
              Connect your wallet to view your storage
            </p>
          </div>
        )}

        {/* Debug Information */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 rounded-lg p-4 mt-6">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <pre className="text-xs text-gray-700">
              {JSON.stringify(
                {
                  connected: wallet.connected,
                  publicKey: wallet.publicKey?.toString(),
                  hasStorageAccount,
                  storageInfo: storageInfo
                    ? {
                        totalFiles: storageInfo.totalFiles?.toString(),
                        totalStorageUsed:
                          storageInfo.totalStorageUsed?.toString(),
                        owner: storageInfo.owner?.toString(),
                      }
                    : null,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
