"use client";

export function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Contrast Checker",
            description:
              "Test color contrast ratios against WCAG guidelines. Check accessibility compliance for AA and AAA levels.",
            url: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
            applicationCategory: "Utility",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript and modern browser",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            author: {
              "@type": "Organization",
              name: "ItsJust Tools",
            },
          }),
        }}
      />
    </>
  );
}
