import type { Metadata } from "next";
import SdetLabClient from "./SdetLabClient";

export const metadata: Metadata = {
  title: "SDET Practice Lab | BetappaBharath API TestLab",
  description: "Practise API failure handling and data-driven testing with live banking requests.",
};

export default function SdetLabPage() { return <SdetLabClient />; }
