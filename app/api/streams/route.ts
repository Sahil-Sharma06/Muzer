import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Regex to validate YouTube URLs
const YT_REGEX = new RegExp(
  "^(https?://)?(www\\.)?(youtube\\.com|youtu\\.?be)/.+$"
);

// Zod schema to validate request body
const CreatorStreamSchema = z.object({
  creatorId: z.string(),
  url: z
    .string()
    .refine(
      (url) => url.includes("youtube.com") || url.includes("spotify.com"),
      { message: "URL must be from YouTube or Spotify" }
    ),
});

// Handle POST request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = CreatorStreamSchema.parse(body);

    const isYt = YT_REGEX.test(data.url);
    if (!isYt) {
      return NextResponse.json(
        { message: "Wrong URL format" },
        { status: 411 }
      );
    }

    const extractedId = data.url.split("?v=")[1]?.split("&")[0] || "";

    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
      },
    });

    return NextResponse.json(
      {
        message: "Stream created successfully",
        stream,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error while adding a Stream",
        error: error instanceof Error ? error.message : error,
      },
      { status: 411 }
    );
  }
}

// Handle GET request
export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");

  const streams = await prismaClient.stream.findMany({
    where: {
      userId: creatorId ?? "",
    },
  });

  return NextResponse.json({ streams });
}
