import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { idl } from "../lib/idl";

export const PROGRAM_ID = new PublicKey(
  "2DWNrUtJXqnA9qu444yyACg2VXnXmEqwBPG7Q7cgM1NM" // replace if needed
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

export const derivePdas = (user: PublicKey | undefined, fileHash?: string) => {
  if (!user) {
    throw new Error("User public key is required for deriving PDAs");
  }

  const [storagePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("storage"), user.toBuffer()],
    PROGRAM_ID
  );

  const fileSeeds = fileHash
    ? [Buffer.from("file"), user.toBuffer(), Buffer.from(fileHash)]
    : undefined;

  const filePda = fileSeeds
    ? PublicKey.findProgramAddressSync(fileSeeds, PROGRAM_ID)[0]
    : undefined;

  return { storagePda, filePda };
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

    // Try different account name variations based on common Rust naming
    const accountsConfig = {
      owner: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    };

    // Try the most common naming patterns
    try {
      await program.methods
        .initializeStorage()
        .accounts({
          ...accountsConfig,
          storageAccount: storagePda,
        })
        .rpc();
    } catch (firstError) {
      console.log("Trying alternative account name...");
      try {
        await program.methods
          .initializeStorage()
          .accounts({
            ...accountsConfig,
            storage: storagePda,
          })
          .rpc();
      } catch (secondError) {
        try {
          await program.methods
            .initializeStorage()
            .accounts({
              ...accountsConfig,
              userStorage: storagePda,
            })
            .rpc();
        } catch (thirdError) {
          console.error(
            "All account naming attempts failed. Check your Rust program's account names."
          );
          throw firstError; // Throw the original error
        }
      }
    }

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

    // Re-throw the error so the calling code can handle it appropriately
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
    const { filePda } = derivePdas(wallet.publicKey, fileHash);

    if (!filePda) {
      throw new Error("Failed to derive file PDA");
    }

    await program.methods
      .uploadFile(
        fileHash,
        fileName,
        new anchor.BN(fileSize),
        ipfsHash,
        encryptionKey
      )
      .accounts({
        owner: wallet.publicKey,
        file: filePda,
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
  recipient: PublicKey
) {
  if (!wallet?.connected || !wallet?.publicKey) {
    throw new Error("Wallet not connected or publicKey not available");
  }

  if (!fileHash) {
    throw new Error("File hash is required");
  }

  if (!recipient) {
    throw new Error("Recipient public key is required");
  }

  try {
    const program = getProgram(wallet);
    const { filePda } = derivePdas(wallet.publicKey, fileHash);

    if (!filePda) {
      throw new Error("Failed to derive file PDA");
    }

    await program.methods
      .shareFile()
      .accounts({
        owner: wallet.publicKey,
        file: filePda,
        recipient,
        systemProgram: SystemProgram.programId,
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
    const { filePda } = derivePdas(wallet.publicKey, fileHash);

    if (!filePda) {
      throw new Error("Failed to derive file PDA");
    }

    await program.methods
      .deleteFile()
      .accounts({
        owner: wallet.publicKey,
        file: filePda,
      })
      .rpc();
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}
