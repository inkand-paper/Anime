export interface VideoSource {
  label: string;
  url: string;
  type: "iframe" | "hls" | "mp4";
  priority: number;
}

export async function resolveVideoSources(animeId: string, episode: number): Promise<VideoSource[]> {
  const sources: VideoSource[] = [
    { label: "Goda", url: "https://example.com/embed/goda/1", type: "iframe", priority: 1 },
    { label: "Vidstreaming", url: "https://example.com/embed/vid/1", type: "iframe", priority: 2 },
    { label: "Hydrax", url: "https://example.com/embed/hydrax/1", type: "iframe", priority: 3 },
    { label: "Mp4Upload", url: "https://example.com/stream/mp4/1.mp4", type: "mp4", priority: 4 },
    { label: "Doodstream", url: "https://example.com/embed/dood/1", type: "iframe", priority: 5 },
    { label: "Streamtape", url: "https://example.com/embed/tape/1", type: "iframe", priority: 6 },
    { label: "HLS Mirror", url: "https://example.com/master.m3u8", type: "hls", priority: 7 },
  ];
  return sources.sort((a, b) => a.priority - b.priority);
}

