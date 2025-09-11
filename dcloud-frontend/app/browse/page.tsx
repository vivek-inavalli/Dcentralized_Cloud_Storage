"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { getPublicFiles, downloadFile } from "../../lib/anchorClient";

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
  const [loading, setLoading] = useState(false);

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load public files
  useEffect(() => {
    const loadPublicFiles = async () => {
      if (mounted && wallet) {
        setLoading(true);
        try {
          const files = await getPublicFiles(wallet);
          setPublicFiles(files);
          console.log("Public files:", files);
        } catch (error) {
          console.error("Error loading public files:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadPublicFiles();
  }, [wallet, mounted]);

  const handleDownload = async (file: FileData) => {
    if (!wallet.connected || !wallet.publicKey) {
      alert("Please connect your wallet to download files");
      return;
    }

    try {
      // Call the download function to track access
      await downloadFile(wallet, file.fileHash);

      // Then redirect to IPFS
      const ipfsUrl = `https://ipfs.io/ipfs/${file.ipfsHash}`;
      window.open(ipfsUrl, "_blank");

      // Refresh the list to update access count
      const updatedFiles = await getPublicFiles(wallet);
      setPublicFiles(updatedFiles);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Still allow IPFS download even if blockchain call fails
      const ipfsUrl = `https://ipfs.io/ipfs/${file.ipfsHash}`;
      window.open(ipfsUrl, "_blank");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filterPublic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (searchTerm.length === 0) {
      setPublicFiles(publicFiles);
    }
    const filteredList = publicFiles.filter((item: FileData) =>
      item.fileName.toLowerCase().includes(searchTerm)
    );
    setPublicFiles(filteredList);
  };

  // Don't render until mounted (prevents hydration errors)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Browse Public Files
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Browse Public Files
          </h1>
          <p className="text-lg text-gray-600">
            Discover files shared by the community
          </p>
        </div>

        {/* Wallet Connection (optional for browsing) */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Wallet Connection</h2>
              <p className="text-sm text-gray-600">Connect to download files</p>
            </div>
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
          </div>
        </div>

        {/* Public Files Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Public Files</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Refresh
            </button>
          </div>
          <input onChange={(e) => filterPublic(e)} />
          {loading ? (
            <div className="text-center py-8">
              <p>Loading public files...</p>
            </div>
          ) : publicFiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No public files available yet
              </p>
              <p className="text-sm text-gray-400">
                Upload and share files to see them here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicFiles.map((file) => (
                <div
                  key={file.publicKey}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="mb-3">
                    <h3
                      className="font-semibold text-lg truncate"
                      title={file.fileName}
                    >
                      {file.fileName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Size: {formatFileSize(file.fileSize)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Uploaded:{" "}
                      {new Date(
                        file.uploadTimestamp * 1000
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Downloads: {file.accessCount}
                    </p>
                    <p
                      className="text-xs text-gray-500 truncate"
                      title={file.owner}
                    >
                      Owner: {file.owner.slice(0, 8)}...{file.owner.slice(-8)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      {wallet.connected
                        ? "Download"
                        : "Connect Wallet to Download"}
                    </button>

                    {!wallet.connected && (
                      <button
                        onClick={() => {
                          const ipfsUrl = `https://ipfs.io/ipfs/${file.ipfsHash}`;
                          window.open(ipfsUrl, "_blank");
                        }}
                        className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                      >
                        Direct IPFS Link
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Section */}
        {publicFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Network Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-semibold text-blue-800">
                  Total Public Files
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  {publicFiles.length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-semibold text-green-800">Total Size</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatFileSize(
                    publicFiles.reduce((sum, file) => sum + file.fileSize, 0)
                  )}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h4 className="font-semibold text-purple-800">
                  Total Downloads
                </h4>
                <p className="text-2xl font-bold text-purple-600">
                  {publicFiles.reduce((sum, file) => sum + file.accessCount, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
