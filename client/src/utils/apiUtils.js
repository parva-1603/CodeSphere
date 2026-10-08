// Utility to safely parse fetch responses without throwing SyntaxError: Unexpected end of JSON input
export const parseJsonResponse = async (res) => {
  try {
    const text = await res.text();
    if (!text || !text.trim()) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { error: `Invalid response from server (Status ${res.status})` };
    }
  } catch {
    return { error: `Network error (Status ${res.status})` };
  }
};
