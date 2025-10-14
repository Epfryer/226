import { isTouchCapable } from "@/utils/isTouchCapable";

type Actions = {
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onDownload?: () => void;
  onFullscreen?: () => void;
};

type ToolbarApi = {
  destroy: () => void;
  element: HTMLDivElement;
};

export function mountToolbar(host: HTMLElement, actions: Actions): ToolbarApi {
  const TOUCH = isTouchCapable();
  const bar = document.createElement("div");
  bar.className = "fv-toolbar";
  bar.innerHTML = `
    <button data-act="prev" aria-label="Previous page">◀</button>
    <div class="fv-sep"></div>
    <button data-act="zoomOut" aria-label="Zoom out">－</button>
    <button data-act="zoomIn" aria-label="Zoom in">＋</button>
    <button data-act="reset" aria-label="Fit to page">⤾</button>
    ${actions.onFullscreen ? `<button data-act="fs" aria-label="Fullscreen">⛶</button>` : ""}
    ${actions.onDownload ? `<button data-act="dl" aria-label="Download PDF">⬇</button>` : ""}
    ${TOUCH ? "" : `<div class="fv-hint" aria-hidden="true">Ctrl/⌘ + Scroll to zoom</div>`}
  `.trim();

  const bind = (sel: string, fn?: () => void) => {
    const button = bar.querySelector<HTMLButtonElement>(`[data-act="${sel}"]`);
    if (button && fn) button.addEventListener("click", fn);
    return () => {
      if (button && fn) button.removeEventListener("click", fn);
    };
  };

  const unbindPrev = bind("prev", () => actions.onPrev());
  const unbindZoomOut = bind("zoomOut", () => actions.onZoomOut());
  const unbindZoomIn = bind("zoomIn", () => actions.onZoomIn());
  const unbindReset = bind("reset", () => actions.onReset());
  const unbindFullscreen = bind("fs", actions.onFullscreen);
  const unbindDownload = bind("dl", actions.onDownload);

  host.appendChild(bar);

  let idle: number | undefined;
  const show = () => {
    bar.classList.add("show");
    if (idle) window.clearTimeout(idle);
    idle = window.setTimeout(() => {
      bar.classList.remove("show");
    }, 1800);
  };

  const events: Array<[keyof DocumentEventMap, EventListener]> = [
    ["pointermove", show],
    ["pointerdown", show],
    ["wheel", show],
    ["keydown", show],
  ];

  events.forEach(([event, handler]) => {
    host.addEventListener(event, handler, { passive: true } as EventListenerOptions);
  });

  show();

  return {
    element: bar,
    destroy: () => {
      unbindPrev();
      unbindZoomOut();
      unbindZoomIn();
      unbindReset();
      unbindFullscreen();
      unbindDownload();
      events.forEach(([event, handler]) => {
        host.removeEventListener(event, handler);
      });
      if (idle) window.clearTimeout(idle);
      bar.remove();
    },
  };
}
