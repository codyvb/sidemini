export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)] flex items-center justify-center">
      <main className="flex flex-col gap-8 items-center sm:items-start w-full max-w-[1000px]">
        <div className="text-6xl md:text-[80px] mt-[-50px] sm:text-[100px] sm:mt-[-200px] leading-tight md:leading-[1.1] tracking-tight">
          Don&lsquo;t let your dreams be dreams.
        </div>
        <div>Have an idea for a sidequest? We'd love to hear from you. reach out to <a href="https://warpcast.com/codyb.eth" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-400 underline">@codyb.eth</a> on Farcaster</div>
      </main>
    </div>
  );
}
