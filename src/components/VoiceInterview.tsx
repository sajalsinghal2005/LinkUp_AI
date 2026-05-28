import { useState } from "react";
import { GoogleGenAI }
from "@google/genai";
interface VoiceInterviewProps {
  job?: {
    job_title: string;
  };
}

function VoiceInterview({ job }: VoiceInterviewProps) {
  const role = job?.job_title?.toLowerCase() || "";

  let questions = [
    "Tell me about yourself",
    "What are your strengths?",
    "Why should we hire you?",
  ];

  if (role.includes("frontend")) {
    questions = [
      "What is React?",
      "What is Virtual DOM?",
      "Explain hooks in React.",
    ];
  } else if (role.includes("backend")) {
    questions = [
      "What is Node.js?",
      "Explain REST APIs.",
      "What is Express.js?",
    ];
  } else if (role.includes("ai") || role.includes("machine learning")) {
    questions = [
      "What is Machine Learning?",
      "What is overfitting?",
      "Explain supervised learning.",
    ];
  } else if (
    role.includes("software") ||
    role.includes("developer") ||
    role.includes("development") ||
    role.includes("engineer") ||
    role.includes("full stack") ||
    role.includes("fullstack") ||
    role.includes("programmer") ||
    role.includes("coding") ||
    role.includes("intern")
  ) {
    questions = [
      "Explain the difference between a compiler and an interpreter.",
      "What is Git and why is version control important?",
      "Explain the concept of OOP (Object-Oriented Programming).",
      "What is a RESTful API and how does it work?",
      "Describe a challenging software bug you solved recently.",
    ];
  }

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [feedback,
setFeedback] =
useState("");

const [score,
setScore] =
useState(0);

  const [answer,
  setAnswer] =
  useState("");

  const [listening,
  setListening] =
  useState(false);
const ai =
  new GoogleGenAI({

    apiKey:
      import.meta.env.VITE_GEMINI_API_KEY,

  });
 const startListening = () => {

  const SpeechRecognition =

    (window as any)
      .SpeechRecognition ||

    (window as any)
      .webkitSpeechRecognition;

  if (!SpeechRecognition) {

    alert(
      "Speech Recognition not supported in this browser"
    );

    return;

  }

  const recognition =
    new SpeechRecognition();

  recognition.lang =
    "en-US";

  recognition.continuous =
    false;

  recognition.interimResults =
    false;

  recognition.start();

  setListening(true);

 recognition.onresult =
  async (event: any) => {

    const transcript =

      event.results[0][0]
        .transcript;

    setAnswer(transcript);

    setListening(false);

    try {

      const result =
        await ai.models.generateContent({

          model:
            "gemini-2.5-flash",

          contents:

`
You are an AI interview evaluator.

Question:
${questions[currentQuestion]}

Candidate Answer:
${transcript}

Give:

1. Score out of 10
2. Short feedback
3. Improvement tip

Keep response short.
`,

        });

      const feedbackText =
        result.text || "AI feedback generation failed.";

      setFeedback(
        feedbackText
      );

      const detectedScore =
        feedbackText.match(
          /\d+\/10/
        );

      if (detectedScore) {

        setScore(

          parseInt(
            detectedScore[0]
          )

        );

      }

    }

    catch (error) {

      console.log(error);

      setFeedback(
        "AI feedback failed."
      );

    }

};
};
  return (
    <>
{
  feedback && (

    <div className="mt-6 rounded-2xl bg-black/40 p-6">

      <h2 className="text-2xl font-bold text-cyan-400">

        AI Feedback (Score: {score}/10)

      </h2>

      <p className="mt-4 whitespace-pre-line text-slate-300">

        {feedback}

      </p>

    </div>

  )
}
    <div className="mt-10 rounded-3xl border border-cyan-500/30 bg-[#081028] p-8">

      <h1 className="text-4xl font-bold text-cyan-400">

        AI Voice Interview

      </h1>

      <p className="mt-6 text-2xl text-white">

        Q{currentQuestion + 1}.
        {

          questions[
            currentQuestion
          ]

        }

      </p>

      <button

        onClick={startListening}

        className="mt-8 rounded-2xl bg-cyan-400 px-6 py-3 text-black font-bold"

      >

        {

          listening
          ?

          "Listening..."

          :

          "Start Speaking"

        }

      </button>

      <div className="mt-8 rounded-2xl bg-black/40 p-6">

        <h2 className="text-xl font-bold text-cyan-400">

          Your Answer

        </h2>

        <p className="mt-4 text-slate-300">

          {answer}

        </p>

      </div>

      <button

        onClick={() =>
          setCurrentQuestion(
            currentQuestion + 1
          )
        }

        className="mt-8 rounded-2xl border border-cyan-400 px-6 py-3 text-cyan-400"

      >

        Next Question

      </button>

    </div>
    </>
  );

}

export default VoiceInterview;