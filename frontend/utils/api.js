export async function apiFetch(url, options = {}) {
  let targetUrl = url;
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL
    ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, "")
    : "http://127.0.0.1:8000";

  if (typeof targetUrl === "string") {
    if (targetUrl.startsWith("http://localhost:8000")) {
      targetUrl = targetUrl.replace("http://localhost:8000", backendBase);
    } else if (targetUrl.startsWith("http://127.0.0.1:8000")) {
      targetUrl = targetUrl.replace("http://127.0.0.1:8000", backendBase);
    } else if (targetUrl.startsWith("/")) {
      targetUrl = `${backendBase}${targetUrl}`;
    }
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