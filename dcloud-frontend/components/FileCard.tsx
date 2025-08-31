"use client";
import Link from "next/link";

export type FileUI = {
  fileHash: string;
  fileName: string;
  fileSize: number;
  ipfsHash: string;
  isPublic: boolean;
  uploadTimestamp: number;
  accessCount: number;
};

export default function FileCard({
  f,
  onDelete,
  onToggleShare,
}: {
  f: FileUI;
  onDelete?: () => void;
  onToggleShare?: () => void;
}) {
  const sizeMB = (f.fileSize / (1024 * 1024)).toFixed(2);
  const date = new Date(Number(f.uploadTimestamp) * 1000).toLocaleString();
  return (
    <div className="card flex items-center justify-between gap-4">
      <div>
        <div className="font-semibold">{f.fileName}</div>
        <div className="text-xs text-gray-400">{f.fileHash}</div>
        <div className="text-sm text-gray-400 mt-1">
          {sizeMB} MB • {date} • accesses: {f.accessCount}
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/files/${encodeURIComponent(f.fileHash)}`}
          className="btn btn-outline"
        >
          Details
        </Link>
        <a
          href={`https://ipfs.io/ipfs/${f.ipfsHash}`}
          target="_blank"
          className="btn btn-outline"
        >
          Open IPFS
        </a>
        {onToggleShare && (
          <button onClick={onToggleShare} className="btn btn-outline">
            {f.isPublic ? "Make Private" : "Make Public"}
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="btn bg-red-600 hover:bg-red-500 text-white"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
