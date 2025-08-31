export const idl = {
  version: "0.1.0",
  name: "decentralized_cloud_storage",
  address: "2DWNrUtJXqnA9qu444yyACg2VXnXmEqwBPG7Q7cgM1NM",
  instructions: [
    {
      name: "initializeStorage",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "storageAccount", isMut: true },
        { name: "systemProgram", isMut: false },
      ],
      args: [],
    },
    {
      name: "uploadFile",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "storageAccount", isMut: true },
        { name: "fileAccount", isMut: true },
        { name: "systemProgram", isMut: false },
      ],
      args: [
        { name: "fileHash", type: "string" },
        { name: "fileName", type: "string" },
        { name: "fileSize", type: "u64" },
        { name: "ipfsHash", type: "string" },
        { name: "encryptionKey", type: { option: "string" } },
      ],
    },
    {
      name: "downloadFile",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "fileAccount", isMut: true },
      ],
      args: [{ name: "fileHash", type: "string" }],
    },
    {
      name: "deleteFile",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "storageAccount", isMut: true },
        { name: "fileAccount", isMut: true },
      ],
      args: [],
    },
    {
      name: "shareFile",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "fileAccount", isMut: true },
      ],
      args: [{ name: "isPublic", type: "bool" }],
    },
    {
      name: "getStorageInfo",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "storageAccount", isMut: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "FileAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "fileHash", type: "string" },
          { name: "fileName", type: "string" },
          { name: "fileSize", type: "u64" },
          { name: "ipfsHash", type: "string" },
          { name: "encryptionKey", type: { option: "string" } },
          { name: "uploadTimestamp", type: "i64" },
          { name: "isPublic", type: "bool" },
          { name: "accessCount", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "StorageAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "totalFiles", type: "u32" },
          { name: "totalStorageUsed", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  types: [
    {
      name: "FileInfo",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "fileHash", type: "string" },
          { name: "fileName", type: "string" },
          { name: "fileSize", type: "u64" },
          { name: "ipfsHash", type: "string" },
          { name: "uploadTimestamp", type: "i64" },
          { name: "isPublic", type: "bool" },
          { name: "accessCount", type: "u64" },
        ],
      },
    },
    {
      name: "StorageInfo",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "totalFiles", type: "u32" },
          { name: "totalStorageUsed", type: "u64" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "FileHashTooLong", msg: "File hash too long" },
    { code: 6001, name: "FileNameTooLong", msg: "File name too long" },
    { code: 6002, name: "IpfsHashTooLong", msg: "IPFS hash too long" },
    { code: 6003, name: "InvalidFileSize", msg: "Invalid file size" },
    { code: 6004, name: "UnauthorizedAccess", msg: "Unauthorized access" },
  ],
  events: [
    {
      name: "FileUploaded",
      fields: [
        { name: "owner", type: "publicKey", index: false },
        { name: "fileHash", type: "string", index: false },
        { name: "fileName", type: "string", index: false },
        { name: "fileSize", type: "u64", index: false },
        { name: "timestamp", type: "i64", index: false },
      ],
    },
    {
      name: "FileDeleted",
      fields: [
        { name: "owner", type: "publicKey", index: false },
        { name: "fileHash", type: "string", index: false },
        { name: "timestamp", type: "i64", index: false },
      ],
    },
    {
      name: "FileAccessed",
      fields: [
        { name: "accessor", type: "publicKey", index: false },
        { name: "fileHash", type: "string", index: false },
        { name: "timestamp", type: "i64", index: false },
      ],
    },
    {
      name: "FileShared",
      fields: [
        { name: "owner", type: "publicKey", index: false },
        { name: "fileHash", type: "string", index: false },
        { name: "isPublic", type: "bool", index: false },
        { name: "timestamp", type: "i64", index: false },
      ],
    },
  ],
};
