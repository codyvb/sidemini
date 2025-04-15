import Header from "~/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Header />
      <div className="flex flex-col justify-center items-center min-h-[80vh] px-4 sm:px-8 font-[family-name:var(--font-geist-sans)] w-full">
        <main className="w-full max-w-xl">
          <div className="text-center text-4xl sm:text-6xl md:text-[80px] mt-0 sm:mt-[-60px] leading-tight md:leading-[1.1] tracking-tight mb-8 text-gray-900">
            Don&apos;t let your dreams be dreams.
          </div>
          <div className="text-center text-lg sm:text-xl text-gray-900 leading-relaxed">
            Have an idea for a sidequest? We&apos;d love to hear from you. Reach out to{' '}
            <a
              href="https://warpcast.com/codyb.eth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:text-purple-400 underline"
            >
              @codyb.eth
            </a>{' '}
            on Farcaster.
          </div>
        </main>
      </div>
      {/* Simple back button at the bottom */}
      <div className="w-full flex justify-center mt-12 mb-6">
        <a
          href="/"
          className="px-6 py-3 rounded-full bg-gray-100 text-gray-900 font-semibold shadow text-base active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400"
          aria-label="Go back"
        >
          ← Back
        </a>
      </div>
    </div>
  );
}
