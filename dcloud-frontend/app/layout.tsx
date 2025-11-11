import "../app/globals.css";
import Navbar from "components/Navbar";
import SolanaWalletProvider from "components/WalletProvider";

export const metadata = {
  title: "DCloud – Decentralized Cloud Storage",
  description: "Store & share files securely on Solana + IPFS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <SolanaWalletProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-lg">
              <div className="container-max py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-sm text-slate-600">
                      © 2025 DCloud. Decentralized storage on Solana + IPFS.
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-600">
                    <a
                      href="#"
                      className="hover:text-blue-600 transition-colors"
                    >
                      Documentation
                    </a>
                    <a
                      href="#"
                      className="hover:text-blue-600 transition-colors"
                    >
                      GitHub
                    </a>
                    <a
                      href="#"
                      className="hover:text-blue-600 transition-colors"
                    >
                      Support
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
