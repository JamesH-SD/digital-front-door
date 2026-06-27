import { NextResponse } from "next/server";

export async function GET() {
  const script = `
(function () {
  var currentScript = document.currentScript;
  var tenant = currentScript && currentScript.getAttribute("data-tenant");

  if (!tenant) {
    console.warn("Contactor widget missing data-tenant.");
    return;
  }

  var scriptUrl = new URL(currentScript.src);
  var appOrigin = scriptUrl.origin;

  var pageParams = new URLSearchParams(window.location.search);
  var shouldAutoOpen =
    pageParams.get("openChat") === "1" ||
    pageParams.get("contactor") === "open" ||
    pageParams.get("source") === "qr";

  var source = pageParams.get("source") || "embedded";

  var iframeSrc =
    appOrigin +
    "/" +
    encodeURIComponent(tenant) +
    "?embed=1&source=" +
    encodeURIComponent(source) +
    "&openChat=1";

  var container = document.createElement("div");
  container.id = "contactor-widget-root";
  container.style.position = "fixed";
  container.style.right = "20px";
  container.style.bottom = "20px";
  container.style.zIndex = "2147483647";
  container.style.fontFamily =
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  var button = document.createElement("button");
  button.type = "button";
  button.innerHTML = "✨ AI Receptionist";
  button.style.border = "0";
  button.style.borderRadius = "999px";
  button.style.background = "#111827";
  button.style.color = "#ffffff";
  button.style.padding = "14px 22px";
  button.style.fontSize = "14px";
  button.style.fontWeight = "700";
  button.style.boxShadow = "0 12px 30px rgba(0,0,0,0.22)";
  button.style.animation = "contactorPulse 3s infinite";

  var panel = document.createElement("div");
  panel.style.display = "none";
  panel.style.width = "460px";
  panel.style.height = "720px";
  panel.style.maxWidth = "calc(100vw - 24px)";
  panel.style.maxHeight = "calc(100vh - 24px)";
  panel.style.borderRadius = "24px";
  panel.style.overflow = "hidden";
  panel.style.background = "#ffffff";
  panel.style.boxShadow = "0 24px 70px rgba(0,0,0,0.28)";
  panel.style.border = "1px solid rgba(17,24,39,0.12)";

  var header = document.createElement("div");
  header.style.height = "44px";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.padding = "0 12px";
  header.style.background = "#111827";
  header.style.color = "#ffffff";

  var title = document.createElement("div");
  title.innerText = "Contactor";
  title.style.fontSize = "13px";
  title.style.fontWeight = "700";

  var close = document.createElement("button");
  close.type = "button";
  close.innerText = "×";
  close.style.border = "0";
  close.style.background = "transparent";
  close.style.color = "#ffffff";
  close.style.fontSize = "24px";
  close.style.cursor = "pointer";
  close.style.lineHeight = "1";

  var iframe = document.createElement("iframe");
  iframe.src = iframeSrc;
  iframe.title = "Contactor AI Chat";
  iframe.style.width = "100%";
  iframe.style.height = "calc(100% - 76px)";
  iframe.style.border = "0";
  iframe.setAttribute("allow", "clipboard-write");

  var poweredBy = document.createElement("a");
  poweredBy.href = "https://getcontactor.com";
  poweredBy.target = "_blank";
  poweredBy.rel = "noopener noreferrer";
  poweredBy.style.height = "32px";
  poweredBy.style.display = "flex";
  poweredBy.style.alignItems = "center";
  poweredBy.style.justifyContent = "center";
  poweredBy.style.gap = "6px";
  poweredBy.style.borderTop = "1px solid rgba(17,24,39,0.08)";
  poweredBy.style.background = "#ffffff";
  poweredBy.style.color = "#6b7280";
  poweredBy.style.fontSize = "12px";
  poweredBy.style.fontWeight = "700";
  poweredBy.style.textDecoration = "none";

  var poweredByText = document.createElement("span");
  poweredByText.innerText = "Powered by";

  var poweredByLogo = document.createElement("img");
  poweredByLogo.src = appOrigin + "/branding/contactor-logo.png";
  poweredByLogo.alt = "Contactor";
  poweredByLogo.style.height = "18px";
  poweredByLogo.style.width = "auto";
  poweredByLogo.style.display = "block";

  poweredBy.appendChild(poweredByText);
  poweredBy.appendChild(poweredByLogo);

  poweredBy.onmouseenter = function () {
    poweredBy.style.color = "#c2410c";
  };
  poweredBy.onmouseleave = function () {
    poweredBy.style.color = "#6b7280";
  };

  header.appendChild(title);
  header.appendChild(close);
  panel.appendChild(header);
  panel.appendChild(iframe);
  panel.appendChild(poweredBy);

  function openWidget() {
    button.style.display = "none";
    panel.style.display = "block";
  }

  function closeWidget() {
    panel.style.display = "none";
    button.style.display = "block";
  }

  button.addEventListener("click", openWidget);
  close.addEventListener("click", closeWidget);

  container.appendChild(panel);
  container.appendChild(button);
  document.body.appendChild(container);

  if (shouldAutoOpen) {
    openWidget();
  }

  var style = document.createElement("style");
  style.innerHTML =
    "@keyframes contactorPulse {" +
    "0% { transform: scale(1); }" +
    "50% { transform: scale(1.04); }" +
    "100% { transform: scale(1); }" +
    "}" +

    "@media (max-width: 640px) {" +
    "#contactor-widget-root { right: 12px !important; bottom: 12px !important; left: 12px !important; }" +
    "#contactor-widget-root > div { width: 100% !important; height: calc(100vh - 24px) !important; max-width: none !important; max-height: none !important; border-radius: 20px !important; }" +
    "}";
  document.head.appendChild(style);
})();
`;

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}