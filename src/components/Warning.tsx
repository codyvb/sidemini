"use client";

const Warning: React.FC = () => {
  // Just track which item is open (only one at a time)

  // Simple toggle function

  return (
    <div className="w-full mx-auto mt-8">
      {/* Single container for both sections */}
      <div className="backdrop-blur-sm rounded-lg border border-black/10">
        {/* Warning banner section */}
        <div className="p-6">
          <div className="flex items-start">
            <div className="mr-4">
              <svg
                className="w-8 h-8 text-black"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-black">
                Sidequests can fail.
              </h2>
              <p className="text-black/80">
              You are supporting a creative project that is in development. There is always a risk that a reward could not be fulfilled.

              </p>
            </div>
          </div>
        </div>

        {/* Dividing line between sections */}

        {/* FAQ section */}
      </div>
    </div>
  );
};

export default Warning;
