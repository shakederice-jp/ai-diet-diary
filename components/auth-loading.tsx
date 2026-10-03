export function AuthLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center bg-[#E6D9C8] px-4 py-10 font-sans">
      <main
        className="w-full max-w-md rounded-3xl bg-[#F3EBDD] p-6 shadow-sm sm:p-8"
        aria-busy="true"
      >
        <p className="text-sm font-medium text-[#F5821F]">AI Diet Diary</p>
        <p className="mt-4 text-sm text-zinc-600">{label}</p>
      </main>
    </div>
  );
}
