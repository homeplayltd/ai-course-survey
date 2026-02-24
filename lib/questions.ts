export interface Question {
  id: string;
  type: "rating" | "multi" | "text";
  text: string;
  min?: number;
  max?: number;
  labels?: [string, string];
  options?: string[];
  placeholder?: string;
}

export const questions: Question[] = [
  {
    id: "overall",
    type: "rating",
    text: "How would you rate the session overall?",
    min: 1,
    max: 5,
    labels: ["Poor", "Excellent"],
  },
  {
    id: "relevance",
    type: "rating",
    text: "How relevant was the content to your work as a designer?",
    min: 1,
    max: 5,
    labels: ["Not relevant", "Very relevant"],
  },
  {
    id: "confidence",
    type: "rating",
    text: "How confident do you now feel using AI tools in your design workflow?",
    min: 1,
    max: 5,
    labels: ["Not confident", "Very confident"],
  },
  {
    id: "useful_topics",
    type: "multi",
    text: "Which topics did you find most useful?",
    options: [
      "AI dictation tools (Wispr Flow)",
      "Vibe Coding (Lovable)",
      "Research Tools (Perplexity)",
      "Image Manipulation (Nano Banana)",
      "I can't decide - my mind is blown",
    ],
  },
  {
    id: "would_recommend",
    type: "rating",
    text: "How likely are you to recommend this session to a colleague?",
    min: 1,
    max: 5,
    labels: ["Unlikely", "Very likely"],
  },
  {
    id: "feedback",
    type: "text",
    text: "Any other feedback or suggestions for future sessions?",
    placeholder: "We would love to hear your thoughts...",
  },
];
