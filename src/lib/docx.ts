import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

export async function buildDocument(
  payload: { company_name: string; industry: string; goal: string; challenge: string },
  aiContent: { situationSummary: string; nextSteps: string },
  filename: string
): Promise<Buffer> {
  const today = new Date().toISOString().split("T")[0];

  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
  };

  const makeRow = (label: string, value: string) =>
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun(label)] })], borders: cellBorders }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun(value)] })], borders: cellBorders }),
      ],
    });

  const overviewTable = new Table({
    rows: [
      makeRow("Company", payload.company_name),
      makeRow("Industry", payload.industry),
      makeRow("Goal", payload.goal),
      makeRow("Challenge", payload.challenge),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const situationParagraphs = aiContent.situationSummary
    .split("\n\n")
    .map((chunk) => new Paragraph({ text: chunk }));

  const nextStepsParagraphs = aiContent.nextSteps
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .map((text) => new Paragraph({ text, numbering: { reference: "default-numbering", level: 0 } }));

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        children: [
          new Paragraph({ text: `${payload.company_name} — Discovery Report`, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: `Generated: ${today}` }),
          new Paragraph({ text: "Company Overview", heading: HeadingLevel.HEADING_2 }),
          overviewTable,
          new Paragraph({ text: "Situation Summary", heading: HeadingLevel.HEADING_2 }),
          ...situationParagraphs,
          new Paragraph({ text: "Recommended Next Steps", heading: HeadingLevel.HEADING_2 }),
          ...nextStepsParagraphs,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
