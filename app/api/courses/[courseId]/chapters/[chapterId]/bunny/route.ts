import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractBunnyVideo, getBunnyEmbedUrl, isValidBunnyEmbedUrl } from "@/lib/bunny";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
    try {
        const { userId } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const courseOwner = await db.course.findUnique({
            where: {
                id: resolvedParams.courseId,
                userId,
            }
        });

        if (!courseOwner) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { bunnyUrl } = await req.json();

        if (!bunnyUrl) {
            return new NextResponse("يرجى إدخال رابط الفيديو", { status: 400 });
        }

        if (!isValidBunnyEmbedUrl(bunnyUrl)) {
            return new NextResponse("رابط Bunny غير صالح", { status: 400 });
        }

        const embedUrl = getBunnyEmbedUrl(bunnyUrl);
        const bunnyVideo = extractBunnyVideo(bunnyUrl);

        if (!embedUrl || !bunnyVideo) {
            return new NextResponse("تعذر قراءة رابط الفيديو", { status: 400 });
        }

        await db.chapter.update({
            where: {
                id: resolvedParams.chapterId,
                courseId: resolvedParams.courseId,
            },
            data: {
                videoUrl: embedUrl,
                videoType: "BUNNY",
                youtubeVideoId: null,
            }
        });

        return NextResponse.json({
            success: true,
            libraryId: bunnyVideo.libraryId,
            videoId: bunnyVideo.videoId,
            url: embedUrl
        });
    } catch (error) {
        console.log("[CHAPTER_BUNNY_UPLOAD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
