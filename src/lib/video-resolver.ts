export interface VideoSource {
  label: string;
  url: string;
  type: "iframe" | "hls" | "mp4";
  priority: number;
}

// The 7 required fallback hosts from the requirements doc
// Host URLs are templates — replace with your actual embed endpoint patterns
const HOST_URL_TEMPLATES: Record<string, (id: string, ep: number) => string> = {
  Doodstream:  (id, ep) => `https://dood.re/e/${id}-ep${ep}`,
  VOE:         (id, ep) => `https://voe.sx/e/${id}-${ep}`,
  Filemoon:    (id, ep) => `https://filemoon.sx/e/${id}${ep}`,
  Streamwish:  (id, ep) => `https://streamwish.to/e/${id}-${ep}`,
  Streamtape:  (id, ep) => `https://streamtape.com/e/${id}${ep}/`,
  MixDrop:     (id, ep) => `https://mixdrop.ag/e/${id}${ep}`,
  Megastream:  (id, ep) => `https://megastream.cc/e/${id}-ep${ep}`,
};

export async function resolveVideoSources(animeId: string, episode: number): Promise<VideoSource[]> {
  const sources: VideoSource[] = Object.entries(HOST_URL_TEMPLATES).map(
    ([label, buildUrl], index) => ({
      label,
      url: buildUrl(animeId, episode),
      type: "iframe" as const,
      priority: index + 1,
    })
  );

  // In production: fetch availability from your mapping DB here.
  // e.g. const available = await fetchHostMapping(animeId, episode);
  // return sources.filter(s => available.includes(s.label));

  return sources;
}

/**
 * Coordinator helper — used by the internal upload tool to record
 * which hosts have a given anime/episode available.
 * Call this after uploading a dubbed file to each host.
 */
export async function registerHostMapping(
  animeId: string,
  episode: number,
  host: keyof typeof HOST_URL_TEMPLATES,
  embedUrl: string
): Promise<void> {
  // Persist to DB (prisma) in production:
  // await prisma.hostMapping.upsert({
  //   where: { animeId_episode_host: { animeId, episode, host } },
  //   create: { animeId, episode, host, embedUrl },
  //   update: { embedUrl },
  // });
  console.log(`[host-mapping] Registered ${host} for ${animeId} ep${episode}: ${embedUrl}`);
}
