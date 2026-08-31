import type { Metadata } from "next";
import DemoTour from "./DemoTour";

export const metadata: Metadata = { title: "2-Minute Project Demo | BetappaBharath API TestLab", description: "A short guided walkthrough of the Banking API TestLab for recruiters, educators, and API testers." };

export default function DemoPage() { return <DemoTour />; }
