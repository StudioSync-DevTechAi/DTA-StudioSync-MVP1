import DomeGallery from "@/components/ui/dome-gallery";

export function HeroSectionDome() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-cream">
      {/* Dome Gallery Background - Light mode */}
      <div className="absolute inset-0 z-0 -top-6 md:-top-20 lg:-top-28 opacity-65 backdrop-blur-3xl">
        <DomeGallery 
          overlayBlurColor="#f9f7f4"
          grayscale={false}
          imageBorderRadius="2px"
          openedImageBorderRadius="10px"
        />
      </div>
    </section>
  );
}

