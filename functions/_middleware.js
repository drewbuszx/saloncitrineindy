/**
 * Cloudflare Pages middleware: canonicalize host + ensure /404 returns 404.
 * Branch preview hosts (*.saloncitrineindy.pages.dev) are left alone for review.
 */
const APEX_HOST = "saloncitrineindy.com";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  if (host === `www.${APEX_HOST}` || host === "saloncitrineindy.pages.dev") {
    url.hostname = APEX_HOST;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  const response = await context.next();

  if (url.pathname === "/404" || url.pathname === "/404/") {
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, follow");
    return new Response(response.body, {
      status: 404,
      statusText: "Not Found",
      headers,
    });
  }

  return response;
}
