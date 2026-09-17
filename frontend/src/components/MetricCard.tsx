export function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-35 flex-1 px-6 py-5">
      <p className="text-sm text-[#93A69B]">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#7FD9B6]">
        {value}
      </p>
    </div>
  );
}