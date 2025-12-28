import React from "react";

export function Footer() {
  return (
    <footer className="py-4 px-4 border-t border-dustyBlue-muted/20 bg-velvet-dark">
      <div className="max-w-6xl mx-auto text-center text-dustyBlue-whisper">
        <p className="font-playfair">&copy; 2025 StudioSyncWork. All rights reserved.</p>
        <p className="text-sm mt-1">
          Tech Powered by{" "}
          <a
            href="https://www.devtechai.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            DevTechAi.Org
          </a>
        </p>
      </div>
    </footer>
  );
}

