import "../styles/globals.css";

export const metadata = {
  title: "Store Support Chat",
  description: "Customer Shopping Assistant",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-[100dvh] bg-slate-50 text-slate-900 flex flex-col antialiased overflow-hidden selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
