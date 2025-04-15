import Header from "~/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Header />
      <div className="flex flex-col justify-center items-center min-h-[80vh] px-4 sm:px-8 font-[family-name:var(--font-geist-sans)] w-full">
        <main className="w-full max-w-xl">
          <div className="text-center text-lg sm:text-xl text-gray-900 leading-relaxed">
            We&apos;re building a new place for devs and backers.
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
