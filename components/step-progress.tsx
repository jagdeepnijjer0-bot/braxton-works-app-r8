export function StepProgress({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="px-6 pt-6">
      <p className="text-sm font-semibold text-[#F59E0B] mb-2">
        Step {step} of {total}
      </p>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#F59E0B] transition-all"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  )
}
