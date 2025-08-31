"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { uploadFile, storageAccountExists } from "../../lib/anchorClient";

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
          console.log("Storage account exists:", exists);
        } catch (error) {
          console.error("Error checking storage account:", error);
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
    // Check wallet connection first
    if (!wallet.connected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!wallet.publicKey) {
      alert("Wallet publicKey not available");
      return;
    }

    // Check if storage account exists
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
      // Generate unique file hash
      const fileHash = await createUniqueFileHash(file);

      // For demo purposes, we'll use a placeholder IPFS hash
      // In production, you'd upload to IPFS first and get the real hash
      const ipfsHash = "QmPlaceholderHashForDemo" + Date.now();

      console.log("Uploading file:", {
        name: file.name,
        size: file.size,
        hash: fileHash,
        ipfsHash,
      });

      const filePda = await uploadFile(
        wallet,
        fileHash,
        file.name,
        file.size,
        ipfsHash,
        null // No encryption for demo
      );

      console.log("File uploaded successfully:", filePda.toString());
      alert("File uploaded successfully!");

      // Reset form
      setFile(null);
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  // Better hash function that creates a unique identifier
  const createUniqueFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Add timestamp to make it unique (prevents "account already in use" error)
    const timestamp = Date.now().toString();
    return `${hexHash.slice(0, 24)}${timestamp.slice(-8)}`;
  };

  // Don't render until mounted (prevents hydration errors)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Upload Files
            </h1>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Files
          </h1>
          <p className="text-lg text-gray-600">
            Upload your files to decentralized storage
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

        {/* Storage Account Check */}
        {wallet.connected && wallet.publicKey && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">
              Storage Account Status
            </h2>

            {checkingStorage ? (
              <div className="text-center">
                <p>Checking storage account...</p>
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
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Go to Home Page to Initialize
                </a>
              </div>
            )}
          </div>
        )}

        {/* File Upload Section */}
        {wallet.connected && wallet.publicKey && hasStorageAccount && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Upload File</h2>

            <div className="space-y-4">
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
              {file && (
                <div className="p-4 bg-gray-50 rounded">
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
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={
                  uploading || !file || !wallet.connected || !hasStorageAccount
                }
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>

              {/* Upload Status */}
              {uploading && (
                <div className="text-center text-blue-600">
                  <p>📤 Uploading file to blockchain...</p>
                  <p className="text-sm text-gray-600">
                    This may take a few seconds
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions for unconnected users */}
        {!wallet.connected && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-gray-600 mb-4">
              Connect your wallet to start uploading files to decentralized
              storage
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
                  checkingStorage,
                  selectedFile: file?.name || null,
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
