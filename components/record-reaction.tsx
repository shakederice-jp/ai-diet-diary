export function RecordReaction({
  reaction,
}: {
  reaction?: { advisorName: string; line: string } | null;
}) {
  if (!reaction) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className="mt-3 rounded-xl border border-[#F5821F] bg-[#FBF6EE] px-4 py-3 text-sm leading-6 text-zinc-900"
    >
      <span className="font-medium text-[#F5821F]">{reaction.advisorName}</span>
      <span className="mt-1 block">{reaction.line}</span>
    </p>
  );
}
