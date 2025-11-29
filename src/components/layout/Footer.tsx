import React from "react";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Tech Powered by{" "}
            <a
              href="https://www.devtechai.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              DevTechAi.Org
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

