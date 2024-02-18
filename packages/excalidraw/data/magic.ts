import { Theme } from "../element/types";
import { DataURL } from "../types";
import { OpenAIInput, OpenAIOutput } from "./ai/types";

export type MagicCacheData =
  | {
      status: "pending";
    }
  | { status: "done"; html: string }
  | {
      status: "error";
      message?: string;
      code: "ERR_GENERATION_INTERRUPTED" | string;
    };

// const SYSTEM_PROMPT = `You are a skilled front-end developer who builds interactive prototypes from wireframes, and is an expert at CSS Grid and Flex design.
// Your role is to transform low-fidelity wireframes into working front-end HTML code.

// YOU MUST FOLLOW FOLLOWING RULES:

// - Use HTML, CSS, JavaScript to build a responsive, accessible, polished prototype
// - Leverage Tailwind for styling and layout (import as script <script src="https://cdn.tailwindcss.com"></script>)
// - Inline JavaScript when needed
// - Fetch dependencies from CDNs when needed (using unpkg or skypack)
// - Source images from Unsplash or create applicable placeholders
// - Interpret annotations as intended vs literal UI
// - Fill gaps using your expertise in UX and business logic
// - generate primarily for desktop UI, but make it responsive.
// - Use grid and flexbox wherever applicable.
// - Convert the wireframe in its entirety, don't omit elements if possible.

// If the wireframes, diagrams, or text is unclear or unreadable, refer to provided text for clarification.

// Your goal is a production-ready prototype that brings the wireframes to life.

// Please output JUST THE HTML file containing your best attempt at implementing the provided wireframes.`;

const SYSTEM_PROMPT = `You are a well-educated high-school math teacher. You are an expert in teaching algebra, geometry, and calculus. You are also an expert 
in teaching students how to solve math problems using a step-by-step approach. Your role is to provide helpful feedback to students who are struggling with 
math problems based on their work shown on the canvas.

YOU MUST FOLLOW FOLLOWING RULES:
- Provide step-by-step guidance to solve the math problem
- Provide helpful feedback to the student
- Use the student's work as a reference to provide feedback
- Do not give the final answer to the student, but guide them to the correct answer
- Encourage the student to think critically and solve the problem on their own`;

export async function diagramToHTML({
  image,
  apiKey,
  text,
  theme = "light",
}: {
  image: DataURL;
  apiKey: string;
  text: string;
  theme?: Theme;
}) {
  const body: OpenAIInput.ChatCompletionCreateParamsBase = {
    model: "gpt-4-vision-preview",
    // 4096 are max output tokens allowed for `gpt-4-vision-preview` currently
    max_tokens: 4096,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: image,
              detail: "high",
            },
          },
          {
            type: "text",
            text: `Above is the student's work. Please provide feedback based on the student's work.`,
          },
          {
            type: "text",
            text,
          },
        ],
      },
    ],
  };

  let result:
    | ({ ok: true } & OpenAIOutput.ChatCompletion)
    | ({ ok: false } & OpenAIOutput.APIError);

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (resp.ok) {
    const json: OpenAIOutput.ChatCompletion = await resp.json();
    result = { ...json, ok: true };
  } else {
    const json: OpenAIOutput.APIError = await resp.json();
    result = { ...json, ok: false };
  }

  return result;
}
