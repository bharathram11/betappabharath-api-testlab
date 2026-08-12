import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BetappaBharath Banking API TestLab",
  description: "An original hands-on retail banking API testing sandbox for beginners, Postman users, and automation testers.",
  openGraph: {
    title: "BetappaBharath Banking API TestLab",
    description: "Learn retail banking API testing through real practice.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BetappaBharath Banking API TestLab",
    description: "Learn retail banking API testing through real practice.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
