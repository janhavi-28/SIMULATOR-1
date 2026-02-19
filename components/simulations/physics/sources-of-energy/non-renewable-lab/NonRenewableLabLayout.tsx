"use client";

import React from "react";

export interface NonRenewableLabLayoutProps {
  header: React.ReactNode;
  canvas: React.ReactNode;
  controlPanel: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Full-width layout: 75% simulator canvas, 25% control panel.
 * No empty space on sides — utilizes full screen width.
 */
export function NonRenewableLabLayout({
  header,
  canvas,
  controlPanel,
  footer,
}: NonRenewableLabLayoutProps) {
  return (
    <div className="w-full max-w-[100vw] overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl max-h-[82vh] flex flex-col">
      {header}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 max-h-[calc(82vh-4rem)]" style={{ minHeight: "380px" }}>
        {/* 75% canvas — no scroll */}
        <div className="flex flex-col flex-1 min-w-0 md:w-[75%] min-h-0 overflow-hidden">
          <div className="flex-1 min-h-[280px] flex flex-col py-1.5 px-2">
            {canvas}
          </div>
          {footer && <div className="shrink-0 py-1.5 px-2">{footer}</div>}
        </div>
        {/* 25% control panel — scroll only here */}
        <aside className="w-full md:w-[25%] md:min-w-[280px] md:max-h-full flex flex-col border-t md:border-t-0 md:border-l border-slate-700/60 bg-gradient-to-b from-slate-800/98 to-slate-900/98 overflow-y-auto overflow-x-hidden min-h-0 shrink-0 energy-params-scroll">
          {controlPanel}
        </aside>
      </div>
    </div>
  );
}
