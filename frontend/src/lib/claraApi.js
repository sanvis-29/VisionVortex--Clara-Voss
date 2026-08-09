const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function fetchJson(path) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`${path} failed with ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`[Clara API] ${path} failed:`, error);
    return null;
  }
}

export async function getClaraStatus() {
  const data = await fetchJson("/api/agent/status");

  if (!data) {
    return {
      id: "clara_voss",
      state: "OBSERVING",
      active: true,
      cycle_status: "SILENCE",
      discovered: 0,
      rejected: 0,
      published: 0,
      message: "Clara is observing the ecosystem.",
      started_at: null,
      finished_at: null,
    };
  }

  return data;
}

export async function getClaraTopics() {
  const data = await fetchJson("/api/agent/topics");

  return data || {
    topics: [],
  };
}

export async function getClaraFeed() {
  const data = await fetchJson("/api/agent/feed");

  return data || {
    posts: [],
  };
}

export async function getClaraMemory() {
  const data = await fetchJson("/api/agent/memory");

  return (
    data || {
      memories: [],
      beliefs: [],
      memory_count: 0,
      belief_count: 0,
    }
  );
}