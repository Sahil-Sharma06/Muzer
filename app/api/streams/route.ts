import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const YT_REGEX = new RegExp(
  "^(https?://)?(www\\.)?(youtube\\.com|youtu\\.?be)/.+$"
);
const CreatorStreamSchema = z.object({
  creatorId: z.string(),
  url: z
    .string()
    .refine(
      (url) => url.includes("youtube.com") || url.includes("spotify.com"),
      { message: "URL must be from YouTube or Spotify" }
    ),
});
export async function POST(req: NextRequest) {
  try {
    const data = CreatorStreamSchema.parse(await req.json());
    const isYt = YT_REGEX.test(data.url);
    if (!isYt) {
      return NextResponse.json(
        {
          message: "Wrong URL format",
        },
        {
          status: 411,
        }
      );
    }

    const extractedId = data.url.split("?v=")[1];

    await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error while adding a Stream",
      },
      {
        status: 411,
      }
    );
  }
}
