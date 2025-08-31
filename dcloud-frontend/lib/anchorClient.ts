import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { idl } from "../lib/idl";

export const PROGRAM_ID = new PublicKey(
  "2DWNrUtJXqnA9qu444yyACg2VXnXmEqwBPG7Q7cgM1NM"
);

export const endpoint = "https://api.devnet.solana.com";

export const getProvider = (wallet: any) => {
  if (!wallet) {
    throw new Error("Wallet is required");
  }

  const connection = new Connection(endpoint, "processed");
  const provider = new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  anchor.setProvider(provider);
  return provider;
};

export const getProgram = (wallet: any) => {
  const provider = getProvider(wallet);
  return new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider);
};

// Alternative PDA derivation that matches common Solana patterns
export const derivePdas = (user: PublicKey | undefined, fileHash?: string) => {
  if (!user) {
    throw new Error("User public key is required for deriving PDAs");
  }

  const [storagePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("storage"), user.toBuffer()],
    PROGRAM_ID
  );

  let filePda: PublicKey | undefined;

  if (fileHash) {
    // Use a simpler approach - just use the first 32 characters of the hash
    const shortHash = fileHash.slice(0, 32);

    const fileSeeds = [
      Buffer.from("file"),
      user.toBuffer(),
      Buffer.from(shortHash, "utf8"),
    ];

    [filePda] = PublicKey.findProgramAddressSync(fileSeeds, PROGRAM_ID);
  }

  return { storagePda, filePda };
};

// Helper function to create unique file identifier
export const createUniqueFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Add timestamp to make it unique (in case same file is uploaded multiple times)
  const timestamp = Date.now().toString();
  return `${hexHash.slice(0, 24)}${timestamp.slice(-8)}`;
};

//
// === High-level program actions ===
//

// Initialize user storage account
export async function initializeStorage(wallet: any) {
  if (!wallet?.connected || !wallet?.publicKey) {
    throw new Error("Wallet not connected or publicKey not available");
  }

  try {
    const program = getProgram(wallet);
    const { storagePda } = derivePdas(wallet.publicKey);

    console.log("Initialize accounts:", {
      user: wallet.publicKey.toString(),
      storageAccount: storagePda.toString(),
      systemProgram: SystemProgram.programId.toString(),
    });

    await program.methods
      .initializeStorage()
      .accounts({
        user: wallet.publicKey,
        storageAccount: storagePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return storagePda;
  } catch (error) {
    console.error("Error initializing storage:", error);
    throw error;
  }
}

// Fetch storage account info
export async function getStorageInfo(wallet: any, owner: PublicKey) {
  if (!wallet) {
    throw new Error("Wallet is required");
  }

  if (!owner) {
    throw new Error("Owner public key is required");
  }

  try {
    const program = getProgram(wallet);
    const { storagePda } = derivePdas(owner);
    return await program.account.storageAccount.fetch(storagePda);
  } catch (error) {
    // Don't log this as an error since it's expected for new users
    console.log("Storage account check:", error.message);
    throw error;
  }
}

// Check if storage account exists (helper function)
export async function storageAccountExists(
  wallet: any,
  owner: PublicKey
): Promise<boolean> {
  try {
    await getStorageInfo(wallet, owner);
    return true;
  } catch (error) {
    return false;
  }
}

// Upload a file
export async function uploadFile(
  wallet: any,
  fileHash: string,
  fileName: string,
  fileSize: number,
  ipfsHash: string,
  encryptionKey: string | null
) {
  if (!wallet?.connected || !wallet?.publicKey) {
    throw new Error("Wallet not connected or publicKey not available");
  }

  if (!fileHash || !fileName || !ipfsHash) {
    throw new Error("File hash, name, and IPFS hash are required");
  }

  try {
    const program = getProgram(wallet);
    const { storagePda, filePda } = derivePdas(wallet.publicKey, fileHash);

    if (!filePda) {
      throw new Error("Failed to derive file PDA");
    }

    console.log("Upload accounts:", {
      user: wallet.publicKey.toString(),
      storageAccount: storagePda.toString(),
      fileAccount: filePda.toString(),
      systemProgram: SystemProgram.programId.toString(),
    });

    await program.methods
      .uploadFile(
        fileHash,
        fileName,
        new anchor.BN(fileSize),
        ipfsHash,
        encryptionKey
      )
      .accounts({
        user: wallet.publicKey,
        storageAccount: storagePda,
        fileAccount: filePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return filePda;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Fetch file data
export async function getFile(wallet: any, owner: PublicKey, fileHash: string) {
  if (!wallet) {
    throw new Error("Wallet is required");
  }

  if (!owner) {
    throw new Error("Owner public key is required");
  }

  if (!fileHash) {
    throw new Error("File hash is required");
  }

  try {
    const program = getProgram(wallet);
    const { filePda } = derivePdas(owner, fileHash);

    if (!filePda) {
      throw new Error("Failed to derive file PDA");
    }

    return await program.account.fileAccount.fetch(filePda);
  } catch (error) {
    console.error("Error fetching file:", error);
    throw error;
  }
}

// Share file
export async function shareFile(
  wallet: any,
  fileHash: string,
  isPublic: boolean
) {
  if (!wallet?.connected || !wallet?.publicKey) {
    throw new Error("Wallet not connected or publicKey not available");
  }

  if (!fileHash) {
    throw new Error("File hash is required");
  }

  try {
    const program = getProgram(wallet);
    const { filePda } = derivePdas(wallet.publicKey, fileHash);

    if (!filePda) {
      throw new Error("Failed to derive file PDA");
    }

    await program.methods
      .shareFile(isPublic)
      .accounts({
        user: wallet.publicKey,
        fileAccount: filePda,
      })
      .rpc();
  } catch (error) {
    console.error("Error sharing file:", error);
    throw error;
  }
}

// Delete file
export async function deleteFile(wallet: any, fileHash: string) {
  if (!wallet?.connected || !wallet?.publicKey) {
    throw new Error("Wallet not connected or publicKey not available");
  }

  if (!fileHash) {
    throw new Error("File hash is required");
  }

  try {
    const program = getProgram(wallet);
    const { storagePda, filePda } = derivePdas(wallet.publicKey, fileHash);

    if (!filePda) {
      throw new Error("Failed to derive file PDA");
    }

    await program.methods
      .deleteFile()
      .accounts({
        user: wallet.publicKey,
        storageAccount: storagePda,
        fileAccount: filePda,
      })
      .rpc();
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

// Download file
export async function downloadFile(wallet: any, fileHash: string) {
  if (!wallet?.connected || !wallet?.publicKey) {
    throw new Error("Wallet not connected or publicKey not available");
  }

  if (!fileHash) {
    throw new Error("File hash is required");
  }

  try {
    const program = getProgram(wallet);
    const { filePda } = derivePdas(wallet.publicKey, fileHash);

    if (!filePda) {
      throw new Error("Failed to derive file PDA");
    }

    await program.methods
      .downloadFile(fileHash)
      .accounts({
        user: wallet.publicKey,
        fileAccount: filePda,
      })
      .rpc();
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
}

// Get all files for a user by scanning program accounts
export async function getUserFiles(
  wallet: any,
  owner?: PublicKey
): Promise<FileData[]> {
  if (!wallet) {
    throw new Error("Wallet is required");
  }

  const userKey = owner || wallet.publicKey;
  if (!userKey) {
    throw new Error("User public key is required");
  }

  try {
    const program = getProgram(wallet);

    // Get all file accounts for this program
    const fileAccounts = await program.account.fileAccount.all([
      {
        memcmp: {
          offset: 8, // Skip discriminator (8 bytes)
          bytes: userKey.toBase58(),
        },
      },
    ]);

    console.log(
      `Found ${fileAccounts.length} files for user:`,
      userKey.toString()
    );

    const files: FileData[] = fileAccounts.map((account) => ({
      publicKey: account.publicKey.toString(),
      owner: account.account.owner.toString(),
      fileHash: account.account.fileHash,
      fileName: account.account.fileName,
      fileSize: account.account.fileSize.toNumber(),
      ipfsHash: account.account.ipfsHash,
      encryptionKey: account.account.encryptionKey,
      uploadTimestamp: account.account.uploadTimestamp.toNumber(),
      isPublic: account.account.isPublic,
      accessCount: account.account.accessCount.toNumber(),
      bump: account.account.bump,
    }));

    return files.sort((a, b) => b.uploadTimestamp - a.uploadTimestamp); // Most recent first
  } catch (error) {
    console.error("Error fetching user files:", error);
    throw error;
  }
}

// Get all public files (for browsing/discovery)
export async function getPublicFiles(wallet: any): Promise<FileData[]> {
  if (!wallet) {
    throw new Error("Wallet is required");
  }

  try {
    const program = getProgram(wallet);

    // Get all file accounts that are public
    const publicFileAccounts = await program.account.fileAccount.all();

    const publicFiles: FileData[] = publicFileAccounts
      .filter((account) => account.account.isPublic)
      .map((account) => ({
        publicKey: account.publicKey.toString(),
        owner: account.account.owner.toString(),
        fileHash: account.account.fileHash,
        fileName: account.account.fileName,
        fileSize: account.account.fileSize.toNumber(),
        ipfsHash: account.account.ipfsHash,
        encryptionKey: account.account.encryptionKey,
        uploadTimestamp: account.account.uploadTimestamp.toNumber(),
        isPublic: account.account.isPublic,
        accessCount: account.account.accessCount.toNumber(),
        bump: account.account.bump,
      }));

    return publicFiles.sort((a, b) => b.uploadTimestamp - a.uploadTimestamp);
  } catch (error) {
    console.error("Error fetching public files:", error);
    throw error;
  }
}

// Get file by specific PDA (if you know the exact file hash)
export async function getFileByHash(
  wallet: any,
  owner: PublicKey,
  fileHash: string
): Promise<FileData | null> {
  try {
    const program = getProgram(wallet);
    const { filePda } = derivePdas(owner, fileHash);

    if (!filePda) {
      throw new Error("Failed to derive file PDA");
    }

    const account = await program.account.fileAccount.fetch(filePda);

    return {
      publicKey: filePda.toString(),
      owner: account.owner.toString(),
      fileHash: account.fileHash,
      fileName: account.fileName,
      fileSize: account.fileSize.toNumber(),
      ipfsHash: account.ipfsHash,
      encryptionKey: account.encryptionKey,
      uploadTimestamp: account.uploadTimestamp.toNumber(),
      isPublic: account.isPublic,
      accessCount: account.accessCount.toNumber(),
      bump: account.bump,
    };
  } catch (error) {
    console.log("File not found:", error.message);
    return null;
  }
}

// Interface for file data
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
