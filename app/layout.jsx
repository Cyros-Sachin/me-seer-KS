// app/layout.jsx
import "./globals.css";
import { Inter } from "next/font/google";
import GoogleProviderWrapper from "./components/GoogleProviderWrapper";
import { Toaster } from "react-hot-toast";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MeSeer - Plan It. Note It.",
  description: "A todo-type productivity app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" reverseOrder={false} />
        <GoogleProviderWrapper>
          {children}
        </GoogleProviderWrapper>
      </body>
    </html>
  );
}
