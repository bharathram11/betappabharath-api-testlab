import type { Metadata } from "next";
import InterviewPrepClient from "./InterviewPrepClient";

export const metadata: Metadata = {
  title: "API Testing Interview Prep | BetappaBharath TestLab",
  description: "Practise API testing and SDET interview questions, scenario answers, and mock interview prompts.",
};

export default function InterviewPrepPage() { return <InterviewPrepClient />; }
