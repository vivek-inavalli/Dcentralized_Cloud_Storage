"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { initializeStorage, storageAccountExists } from "../lib/anchorClient";

export default function HomePage() {
  const wallet = useWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [storageExists, setStorageExists] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issue by only rendering wallet components after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if storage account already exists when wallet connects
  useEffect(() => {
    const checkStorageAccount = async () => {
      if (wallet.connected && wallet.publicKey) {
        try {
          console.log("Checking if storage account exists...");
          const exists = await storageAccountExists(wallet, wallet.publicKey);
          setStorageExists(exists);
          setStorageInitialized(exists);

          if (exists) {
            console.log("✅ Storage account already exists");
          } else {
            console.log(
              "ℹ️ Storage account does not exist yet - ready to initialize"
            );
          }
        } catch (error) {
          console.error("Error checking storage account:", error);
          setStorageExists(false);
          setStorageInitialized(false);
        }
      } else {
        setStorageExists(false);
        setStorageInitialized(false);
      }
    };

    if (mounted) {
      checkStorageAccount();
    }
  }, [wallet.connected, wallet.publicKey, mounted]);

  const handleInit = async () => {
    if (!wallet.connected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!wallet.publicKey) {
      alert("Wallet publicKey not available");
      return;
    }

    setIsInitializing(true);

    try {
      console.log("Initializing storage for:", wallet.publicKey.toString());
      const storagePda = await initializeStorage(wallet);
      console.log("Storage initialized successfully:", storagePda.toString());
      setStorageInitialized(true);
      setStorageExists(true);
      alert("Storage initialized successfully!");
    } catch (error) {
      console.error("Failed to initialize storage:", error);

      // Handle specific error cases
      if (error.message.includes("already in use")) {
        alert("Storage account already exists!");
        setStorageExists(true);
        setStorageInitialized(true);
      } else {
        alert(`Failed to initialize storage: ${error.message}`);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // Don't render wallet components until mounted (fixes hydration)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              DCloud - Decentralized Cloud Storage
            </h1>
            <p className="text-lg text-gray-600">
              Store and share files securely on Solana + IPFS
            </p>
          </div>
          <div className="text-center">
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
            DCloud - Decentralized Cloud Storage
          </h1>
          <p className="text-lg text-gray-600">
            Store and share files securely on Solana + IPFS
          </p>
        </div>

        {/* Wallet Connection Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Wallet Connection</h2>

          <div className="flex flex-col items-center space-y-4">
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />

            {/* Wallet Status */}
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

            {!wallet.connected && (
              <p className="text-gray-500">
                Please connect your wallet to continue
              </p>
            )}
          </div>
        </div>

        {/* Storage Initialization Section */}
        {wallet.connected && wallet.publicKey && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Storage Account</h2>

            {storageExists ? (
              <div className="text-center">
                <p className="text-green-600 font-semibold mb-4">
                  ✅ Storage Account Ready
                </p>
                <p className="text-gray-600">
                  Your decentralized storage account is set up and ready to use!
                </p>

                {/* Add file upload section here later */}
                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    File upload functionality coming next...
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Initialize your storage account to start uploading files
                </p>
                <button
                  onClick={handleInit}
                  disabled={isInitializing}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInitializing ? "Initializing..." : "Initialize Storage"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Debug Information (remove in production) */}
        {/* {process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 rounded-lg p-4 mt-6">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <pre className="text-xs text-gray-700">
              {JSON.stringify(
                {
                  connected: wallet.connected,
                  connecting: wallet.connecting,
                  publicKey: wallet.publicKey?.toString(),
                  storageExists,
                  storageInitialized,
                },
                null,
                2
              )}
            </pre>
          </div>
        )} */}
      </div>
    </div>
  );
}
