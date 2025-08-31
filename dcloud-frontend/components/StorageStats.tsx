import { short } from "@/lib/utils";

export default function StorageStats({
  owner,
  totalFiles,
  totalStorageUsed,
}: {
  owner: string;
  totalFiles: number;
  totalStorageUsed: bigint | number;
}) {
  const mb = Number(totalStorageUsed) / (1024 * 1024);
  return (
    <div className="card grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <div className="label">Owner</div>
        <div className="text-lg font-semibold">{short(owner)}</div>
      </div>
      <div>
        <div className="label">Total Files</div>
        <div className="text-lg font-semibold">{totalFiles}</div>
      </div>
      <div>
        <div className="label">Storage Used</div>
        <div className="text-lg font-semibold">{mb.toFixed(2)} MB</div>
      </div>
    </div>
  );
}
