export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-35 flex-1 px-6 py-5">
      <p className="text-sm text-[#93A69B]">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#F0A672]">
        {value}
      </p>
    </div>
  );
}