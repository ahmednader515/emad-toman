"use client";

import { useEffect, useRef } from "react";
import "plyr/dist/plyr.css";

export type ChapterVideoType = "UPLOAD" | "YOUTUBE" | "BUNNY";

interface PlyrVideoPlayerProps {
  videoUrl?: string;
  youtubeVideoId?: string;
  videoType?: ChapterVideoType;
  className?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export const getPlayerSource = (data: {
  videoUrl: string | null;
  videoType: string | null;
  youtubeVideoId: string | null;
}) => {
  const videoType = (data.videoType as ChapterVideoType) || "UPLOAD";

  return {
    videoType,
    videoUrl: videoType === "YOUTUBE" ? undefined : data.videoUrl || undefined,
    youtubeVideoId: videoType === "YOUTUBE" ? data.youtubeVideoId || undefined : undefined,
  };
};

const parsePlayerMessage = (data: unknown): { event?: string; seconds?: number } => {
  const payload = typeof data === "string" ? (() => {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  })() : data;

  if (!payload || typeof payload !== "object") {
    return {};
  }

  const message = payload as {
    event?: string;
    type?: string;
    seconds?: number;
    currentTime?: number;
    value?: { seconds?: number };
  };

  return {
    event: message.event || message.type,
    seconds: message.seconds ?? message.currentTime ?? message.value?.seconds,
  };
};

export const PlyrVideoPlayer = ({
  videoUrl,
  youtubeVideoId,
  videoType = "UPLOAD",
  className,
  onEnded,
  onTimeUpdate
}: PlyrVideoPlayerProps) => {
  const html5VideoRef = useRef<HTMLVideoElement>(null);
  const youtubeEmbedRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const disableYoutubeOverlay = () => {
    if (videoType !== "YOUTUBE") return;
    const iframe = playerRef.current?.elements?.container?.querySelector?.(
      "iframe"
    ) as HTMLIFrameElement | null;
    if (iframe) {
      iframe.style.pointerEvents = "none";
      iframe.setAttribute("tabindex", "-1");
    }
  };

  useEffect(() => {
    if (videoType !== "BUNNY" || !videoUrl) return;

    const handleMessage = (event: MessageEvent) => {
      const origin = String(event.origin || "");
      if (
        origin !== "https://iframe.mediadelivery.net" &&
        origin !== "https://player.mediadelivery.net"
      ) {
        return;
      }

      const { event: eventName, seconds } = parsePlayerMessage(event.data);
      if (eventName === "ended" || eventName === "complete") {
        onEnded?.();
      }
      if (eventName === "timeupdate" && typeof seconds === "number") {
        onTimeUpdate?.(seconds);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [videoType, videoUrl, onEnded, onTimeUpdate]);

  // Initialize Plyr on mount/update and destroy on unmount
  useEffect(() => {
    if (videoType === "BUNNY") return;

    let isCancelled = false;

    async function setupPlayer() {
      const targetEl =
        videoType === "YOUTUBE" ? youtubeEmbedRef.current : html5VideoRef.current;
      if (!targetEl) return;

      // Dynamically import Plyr to be SSR-safe
      const plyrModule: any = await import("plyr");
      const Plyr: any = plyrModule.default ?? plyrModule;

      if (isCancelled) return;

      // Destroy any previous instance
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const player = new Plyr(targetEl, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "captions",
          "settings",
          "pip",
          "airplay",
          "fullscreen"
        ],
        settings: ["speed", "quality", "loop"],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        youtube: { rel: 0, modestbranding: 1 },
        ratio: "16:9"
      });

      playerRef.current = player;

      if (onEnded) player.on("ended", onEnded);
      if (onTimeUpdate)
        player.on("timeupdate", () => onTimeUpdate(player.currentTime || 0));
      player.on("ready", disableYoutubeOverlay);
      disableYoutubeOverlay();
    }

    setupPlayer();

    return () => {
      isCancelled = true;
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
  }, [videoUrl, youtubeVideoId, videoType, onEnded, onTimeUpdate]);

  const hasVideo =
    (videoType === "YOUTUBE" && !!youtubeVideoId) ||
    ((videoType === "UPLOAD" || videoType === "BUNNY") && !!videoUrl);

  if (!hasVideo) {
    return (
      <div className={`aspect-video bg-muted rounded-lg flex items-center justify-center ${className || ""}`}>
        <div className="text-muted-foreground">لا يوجد فيديو</div>
      </div>
    );
  }

  return (
    <div className={`aspect-video ${className || ""}`}>
      {videoType === "YOUTUBE" && youtubeVideoId ? (
        <div
          ref={youtubeEmbedRef}
          data-plyr-provider="youtube"
          data-plyr-embed-id={youtubeVideoId}
          className="w-full h-full"
        />
      ) : videoType === "BUNNY" && videoUrl ? (
        <iframe
          src={videoUrl}
          className="h-full w-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          loading="lazy"
          title="Bunny Stream video"
        />
      ) : (
        <video ref={html5VideoRef} className="w-full h-full" playsInline crossOrigin="anonymous">
          {videoUrl ? <source src={videoUrl} type="video/mp4" /> : null}
        </video>
      )}
    </div>
  );
};