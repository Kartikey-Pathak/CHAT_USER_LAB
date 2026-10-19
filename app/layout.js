import "../styles/globals.css";

export const metadata = {
  title: "ShopGuard AI — LLM02:2025 Security Lab",
  description: "Multi-customer AI shopping assistant security lab for testing OWASP LLM02:2025 Sensitive Information Disclosure vulnerabilities"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0f17"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-[100dvh] bg-[#0b0f17] text-gray-100 flex flex-col antialiased overflow-hidden selection:bg-blue-600/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
