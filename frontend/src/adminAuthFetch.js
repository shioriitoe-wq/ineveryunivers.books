const originalFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  const requestUrl =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  let url;

  try {
    url = new URL(requestUrl, window.location.href);
  } catch {
    return originalFetch(input, init);
  }

  const isBackendApi =
    url.origin === "http://localhost:5000" ||
    url.origin === "https://ineveryunivers-books-api.onrender.com";

  if (!isBackendApi || !url.pathname.startsWith("/api/")) {
    return originalFetch(input, init);
  }

  const token = sessionStorage.getItem("adminToken");

  if (!token) {
    return originalFetch(input, init);
  }

  const headers = new Headers(
    init.headers || (input instanceof Request ? input.headers : undefined)
  );

  headers.set("Authorization", `Bearer ${token}`);

  return originalFetch(input, { ...init, headers });
};
