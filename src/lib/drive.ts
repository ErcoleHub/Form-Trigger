import { google } from "googleapis";
import { Readable } from "node:stream";

export async function uploadToDrive(buffer: Buffer, filename: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientId) throw new Error("Missing environment variable: GOOGLE_CLIENT_ID");
  if (!clientSecret) throw new Error("Missing environment variable: GOOGLE_CLIENT_SECRET");
  if (!refreshToken) throw new Error("Missing environment variable: GOOGLE_REFRESH_TOKEN");
  if (!folderId) throw new Error("Missing environment variable: GOOGLE_DRIVE_FOLDER_ID");

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  const drive = google.drive({ version: "v3", auth });

  const stream = Readable.from(buffer);

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      body: stream,
    },
    fields: "id",
  });

  const fileId = response.data.id;
  if (!fileId) throw new Error("Drive upload succeeded but returned no file ID");

  return `https://drive.google.com/file/d/${fileId}/view`;
}
