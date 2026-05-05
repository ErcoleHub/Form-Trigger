import { task, logger } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { generateAIContent } from "../lib/ai.js";
import { buildDocument } from "../lib/docx.js";
import { uploadToDrive } from "../lib/drive.js";

const PayloadSchema = z.object({
  company_name: z.string().min(1),
  industry: z.string().min(1),
  goal: z.string().min(1),
  challenge: z.string().min(1),
});

export const generateReport = task({
  id: "generate-report",
  schema: PayloadSchema,
  retry: { maxAttempts: 3, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2 },
  run: async (payload) => {
    const { company_name, industry, goal, challenge } = payload;

    logger.log("Received payload", { company_name, industry });

    const date = new Date().toISOString().split("T")[0];
    const slug = company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const filename = `${slug}-report-${date}.docx`;

    logger.log("Generating AI content...");
    const aiContent = await generateAIContent({ company_name, industry, goal, challenge });
    logger.log("AI content generated");

    logger.log("Building document...");
    const docBuffer = await buildDocument({ company_name, industry, goal, challenge }, aiContent, filename);
    logger.log("Document built", { filename, sizeBytes: docBuffer.length });

    logger.log("Uploading to Google Drive...");
    const fileUrl = await uploadToDrive(docBuffer, filename);
    logger.log("Upload complete", { fileUrl });

    return { success: true, filename, fileUrl };
  },
});
