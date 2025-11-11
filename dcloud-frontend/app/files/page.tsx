// "use client";

// import { useWallet } from "@solana/wallet-adapter-react";
// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import {
//   getFileByHash,
//   downloadFile,
//   shareFile,
//   deleteFile,
// } from "../../../lib/anchorClient";
// import { PublicKey } from "@solana/web3.js";
// import { motion } from "framer-motion";
// import {
//   ArrowLeft,
//   Download,
//   ExternalLink,
//   Globe,
//   Lock,
//   Eye,
//   Calendar,
//   HardDrive,
//   User,
//   Share2,
//   Trash2,
//   Loader2,
//   FileText,
//   AlertCircle,
// } from "lucide-react";

// interface FileData {
//   publicKey: string;
//   owner: string;
//   fileHash: string;
//   fileName: string;
//   fileSize: number;
//   ipfsHash: string;
//   encryptionKey: string | null;
//   uploadTimestamp: number;
//   isPublic: boolean;
//   accessCount: number;
//   bump: number;
// }

// export default function FileDetailPage() {
//   const wallet = useWallet();
//   const params = useParams();
//   const router = useRouter();
//   const [mounted, setMounted] = useState(false);
//   const [file, setFile] = useState<FileData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     const loadFile = async () => {
//       if (!mounted || !params.hash || !wallet) return;

//       setLoading(true);
//       setError(null);

//       try {
//         const fileHash = decodeURIComponent(params.hash as string);

//         // Try to get file - you'll need to know the owner's public key
//         // For now, we'll try with the current wallet's public key
//         if (wallet.publicKey) {
//           const fileData = await getFileByHash(
//             wallet,
//             wallet.publicKey,
//             fileHash
//           );
//           if (fileData) {
//             setFile(fileData);
//           } else {
//             setError("File not found");
//           }
//         } else {
//           setError("Please connect your wallet to view file details");
//         }
//       } catch (err: any) {
//         console.error("Error loading file:", err);
//         setError(err.message || "Failed to load file details");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadFile();
//   }, [mounted, params.hash, wallet, wallet.publicKey]);

//   const handleDownload = async () => {
//     if (!file || !wallet.connected || !wallet.publicKey) {
//       alert("Please connect your wallet");
//       return;
//     }

//     try {
//       await downloadFile(wallet, file.fileHash);
//       window.open(`https://ipfs.io/ipfs/${file.ipfsHash}`, "_blank");

//       // Refresh file data to update access count
//       const updated = await getFileByHash(
//         wallet,
//         new PublicKey(file.owner),
//         file.fileHash
//       );
//       if (updated) setFile(updated);
//     } catch (error) {
//       console.error("Error downloading file:", error);
//       window.open(`https://ipfs.io/ipfs/${file.ipfsHash}`, "_blank");
//     }
//   };

//   const handleShare = async () => {
//     if (!file || !wallet.connected || !wallet.publicKey) return;

//     try {
//       await shareFile(wallet, file.fileHash, !file.isPublic);
//       const updated = await getFileByHash(
//         wallet,
//         new PublicKey(file.owner),
//         file.fileHash
//       );
//       if (updated) setFile(updated);
//     } catch (error: any) {
//       alert(`Error updating visibility: ${error.message}`);
//     }
//   };

//   const handleDelete = async () => {
//     if (!file || !wallet.connected || !wallet.publicKey) return;
//     if (!confirm(`Delete "${file.fileName}"? This action cannot be undone.`))
//       return;

//     try {
//       await deleteFile(wallet, file.fileHash);
//       router.push("/storage");
//     } catch (error: any) {
//       alert(`Error deleting file: ${error.message}`);
//     }
//   };

//   const formatFileSize = (bytes: number) => {
//     if (bytes < 1024) return `${bytes} B`;
//     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
//     return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
//   };

//   const formatDate = (timestamp: number) =>
//     new Date(timestamp * 1000).toLocaleString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//   const isOwner =
//     wallet.publicKey && file && wallet.publicKey.toString() === file.owner;

//   if (!mounted) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen">
//       <div className="container-max py-12">
//         {/* Back Button */}
//         <motion.button
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           onClick={() => router.back()}
//           className="btn btn-secondary mb-8"
//         >
//           <ArrowLeft className="w-4 h-4 mr-2" />
//           Back
//         </motion.button>

//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
//           </div>
//         ) : error ? (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="card text-center py-12"
//           >
//             <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-slate-900 mb-2">
//               Error Loading File
//             </h2>
//             <p className="text-slate-600 mb-6">{error}</p>
//             <button onClick={() => router.back()} className="btn btn-primary">
//               Go Back
//             </button>
//           </motion.div>
//         ) : file ? (
//           <div className="max-w-4xl mx-auto space-y-6">
//             {/* Header Card */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="card"
//             >
//               <div className="flex items-start justify-between mb-6">
//                 <div className="flex items-start gap-4 flex-1">
//                   <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
//                     <FileText className="w-8 h-8 text-white" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <h1 className="text-2xl font-bold text-slate-900 mb-2 break-words">
//                       {file.fileName}
//                     </h1>
//                     <div className="flex flex-wrap items-center gap-3">
//                       {file.isPublic ? (
//                         <span className="badge badge-success flex items-center gap-1">
//                           <Globe className="w-3 h-3" />
//                           Public
//                         </span>
//                       ) : (
//                         <span className="badge badge-warning flex items-center gap-1">
//                           <Lock className="w-3 h-3" />
//                           Private
//                         </span>
//                       )}
//                       {isOwner && (
//                         <span className="badge badge-info">
//                           You own this file
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex flex-wrap gap-3">
//                 <button onClick={handleDownload} className="btn btn-primary">
//                   <Download className="w-4 h-4 mr-2" />
//                   Download
//                 </button>
//                 <a
//                   href={`https://ipfs.io/ipfs/${file.ipfsHash}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="btn btn-secondary"
//                 >
//                   <ExternalLink className="w-4 h-4 mr-2" />
//                   View on IPFS
//                 </a>
//                 {isOwner && (
//                   <>
//                     <button onClick={handleShare} className="btn btn-outline">
//                       <Share2 className="w-4 h-4 mr-2" />
//                       {file.isPublic ? "Make Private" : "Make Public"}
//                     </button>
//                     <button onClick={handleDelete} className="btn btn-danger">
//                       <Trash2 className="w-4 h-4 mr-2" />
//                       Delete
//                     </button>
//                   </>
//                 )}
//               </div>
//             </motion.div>

//             {/* File Information */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="card"
//             >
//               <h2 className="section-title">File Information</h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="flex items-start gap-3">
//                   <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                     <HardDrive className="w-5 h-5 text-blue-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-600 mb-1">File Size</p>
//                     <p className="font-semibold text-slate-900">
//                       {formatFileSize(file.fileSize)}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-start gap-3">
//                   <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                     <Calendar className="w-5 h-5 text-green-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-600 mb-1">Upload Date</p>
//                     <p className="font-semibold text-slate-900">
//                       {formatDate(file.uploadTimestamp)}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-start gap-3">
//                   <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                     <Eye className="w-5 h-5 text-purple-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-600 mb-1">Access Count</p>
//                     <p className="font-semibold text-slate-900">
//                       {file.accessCount} downloads
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-start gap-3">
//                   <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                     <User className="w-5 h-5 text-amber-600" />
//                   </div>
//                   <div>
//                     <p className="text-sm text-slate-600 mb-1">Owner</p>
//                     <p className="font-semibold text-slate-900 text-xs font-mono break-all">
//                       {file.owner}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Blockchain Data */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2 }}
//               className="card bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
//             >
//               <h2 className="section-title">Blockchain Data</h2>
//               <div className="space-y-4">
//                 <div>
//                   <p className="text-sm text-slate-600 mb-2">File Hash</p>
//                   <div className="p-3 bg-white rounded-lg border border-slate-200">
//                     <p className="text-xs font-mono text-slate-700 break-all">
//                       {file.fileHash}
//                     </p>
//                   </div>
//                 </div>

//                 <div>
//                   <p className="text-sm text-slate-600 mb-2">IPFS Hash</p>
//                   <div className="p-3 bg-white rounded-lg border border-slate-200">
//                     <p className="text-xs font-mono text-slate-700 break-all">
//                       {file.ipfsHash}
//                     </p>
//                   </div>
//                 </div>

//                 <div>
//                   <p className="text-sm text-slate-600 mb-2">Account Address</p>
//                   <div className="p-3 bg-white rounded-lg border border-slate-200">
//                     <p className="text-xs font-mono text-slate-700 break-all">
//                       {file.publicKey}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         ) : (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="card text-center py-12"
//           >
//             <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-slate-900 mb-2">
//               File Not Found
//             </h2>
//             <p className="text-slate-600 mb-6">
//               The requested file could not be found
//             </p>
//             <button onClick={() => router.back()} className="btn btn-primary">
//               Go Back
//             </button>
//           </motion.div>
//         )}
//       </div>
//     </div>
//   );
// }
