export type BunnyVideoRef = {
    libraryId: string;
    videoId: string;
};

const BUNNY_HOSTS = new Set([
    "iframe.mediadelivery.net",
    "player.mediadelivery.net",
]);

const VIDEO_PATH =
    /^\/(?:embed|play)\/(\d+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const extractUrlFromEmbedCode = (value: string): string => {
    const trimmed = value.trim();
    const iframeSrc = trimmed.match(/src=["']([^"']+)["']/i);
    return iframeSrc?.[1] || trimmed;
};

export const extractBunnyVideo = (url: string): BunnyVideoRef | null => {
    try {
        const parsed = new URL(extractUrlFromEmbedCode(url));
        if (!BUNNY_HOSTS.has(parsed.hostname.toLowerCase())) {
            return null;
        }

        const match = parsed.pathname.match(VIDEO_PATH);
        if (!match) {
            return null;
        }

        return {
            libraryId: match[1],
            videoId: match[2],
        };
    } catch {
        return null;
    }
};

export const isValidBunnyEmbedUrl = (url: string): boolean => {
    return extractBunnyVideo(url) !== null;
};

export const getBunnyEmbedUrl = (url: string): string | null => {
    const video = extractBunnyVideo(url);
    if (!video) {
        return null;
    }

    const params = new URLSearchParams();
    try {
        const parsed = new URL(extractUrlFromEmbedCode(url));
        parsed.searchParams.forEach((value, key) => {
            params.set(key, value);
        });
    } catch {
        // Keep defaults below when the original query string cannot be parsed.
    }

    if (!params.has("autoplay")) {
        params.set("autoplay", "false");
    }
    if (!params.has("responsive")) {
        params.set("responsive", "true");
    }
    params.set("playerjs", "true");

    return `https://iframe.mediadelivery.net/embed/${video.libraryId}/${video.videoId}?${params.toString()}`;
};
