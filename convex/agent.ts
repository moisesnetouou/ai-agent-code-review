import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values"

const createThreadSchema = z.object({
  prompt: z.string().min(40),
  code: z.string().min(100)
})

const supportAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o-mini"),
  textEmbedding: openai.textEmbeddingModel("text-embedding-3-small"),
  instructions: "You are a code review assistant that is a Senior Software Engineer. Your goal is to help developers review their code by providing constructive feedback, identifying potential issues, and suggesting improvements. Focus on code quality, best practices, and potential bugs but avoid being too basic.",
  tools: { }
})

export const supportAgentStep = supportAgent.asTextAction({
  maxSteps: 10
})

export const createCodeReviewThread = action({
  args: {
    prompt: v.string(),
    code: v.string()
  },
  handler: async (ctx, args) => {
    const { prompt, code } = createThreadSchema.parse(args)

    const { threadId, thread } = await supportAgent.createThread(ctx)

    const result = await thread.generateText({
      prompt: `${prompt}\n\nHere's the code review:\n\`\`\`\n${code}\n\`\`\``,
    })

    return { threadId, text: result.text };
  }
})