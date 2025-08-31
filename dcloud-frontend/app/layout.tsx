// import "../styles/globals.css";
import Navbar from "components/Navbar";
import SolanaWalletProvider from "components/WalletProvider";

export const metadata = {
  title: "DCloud – Decentralized Cloud Storage",
  description: "Store & share files on Solana + IPFS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>
          <Navbar />
          <main className="container-max py-8 space-y-10">{children}</main>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
