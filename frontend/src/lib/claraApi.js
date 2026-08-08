const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function getClaraStatus() {
  try {
    const response = await fetch(`${API_URL}/api/agent/status`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Status API failed");
    }

    return await response.json();
  } catch (error) {
    console.warn("Using mock Clara status:", error);

    return {
      active: true,
      state: "ANALYZING",
      uptime: "12d 14h",
      discovered: 31,
      rejected: 28,
      published: 3,
      currentThought:
        "Does this development actually change how autonomous agents operate?",
    };
  }
}

export async function getClaraFeed() {
  try {
    const response = await fetch(`${API_URL}/api/agent/feed`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Feed API failed");
    }

    return await response.json();
  } catch (error) {
    console.warn("Using mock Clara feed:", error);

    return {
      posts: [],
    };
  }
}

export async function getClaraTopics() {
  try {
    const response = await fetch(`${API_URL}/api/agent/topics`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Topics API failed");
    }

    return await response.json();
  } catch (error) {
    console.warn("Using mock Clara topics:", error);

    return {
      topics: [],
    };
  }
}

export async function getClaraMemory() {
  try {
    const response = await fetch(`${API_URL}/api/agent/memory`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Memory API failed");
    }

    return await response.json();
  } catch (error) {
    console.warn("Using mock Clara memory:", error);

    return {
      memories: [],
      beliefs: [],
    };
  }
}