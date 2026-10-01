export async function apiFetch(url, options = {}) {
  let targetUrl = url;
  if (
    process.env.NEXT_PUBLIC_BACKEND_URL &&
    typeof targetUrl === "string" &&
    targetUrl.startsWith("http://localhost:8000")
  ) {
    targetUrl = targetUrl.replace(
      "http://localhost:8000",
      process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, "")
    );
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("access_token");
  }

  return response;
}