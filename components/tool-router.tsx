"use client";

import dynamic from "next/dynamic";
import { type ComponentType } from "react";

/* Dynamic imports for all tool components – code-split per route */
const componentMap: Record<string, ComponentType> = {
  "001-hundreds-cut": dynamic(() => import("./tools/tool-001-hundreds-cut")),
  "002-low-probability": dynamic(() => import("./tools/tool-002-low-probability")),
  "003-tens-ones-dead": dynamic(() => import("./tools/tool-003-tens-ones-dead")),
  "004-hell-pairs": dynamic(() => import("./tools/tool-004-hell-pairs")),
  "005-three-pair-formulas": dynamic(() => import("./tools/tool-005-three-pair-formulas")),
  "006-green-three": dynamic(() => import("./tools/tool-006-green-three")),
  "008-cross-polarity": dynamic(() => import("./tools/tool-008-cross-polarity")),
  "009-three-dead-pairs": dynamic(() => import("./tools/tool-009-three-dead-pairs")),
  "010-three-think": dynamic(() => import("./tools/tool-010-three-think")),
  "011-direct-cut-4": dynamic(() => import("./tools/tool-011-direct-cut-v9")),
  "012-direct-cut-v2": dynamic(() => import("./tools/tool-012-direct-cut-v2")),
  "015-seven-way-two": dynamic(() => import("./tools/tool-015-seven-way-two")),
  "016-overview": dynamic(() => import("./tools/tool-016-overview")),
  "017-random-one": dynamic(() => import("./tools/tool-017-random-one")),
  "018-random-two": dynamic(() => import("./tools/tool-018-random-two")),
  "022-luck-meter": dynamic(() => import("./tools/tool-022-luck-meter")),
  "legacy-cloud-sim": dynamic(() => import("./tools/tool-cloude-sim")),
  "legacy-gpt-sim": dynamic(() => import("./tools/tool-gpt-sim")),
  "legacy-simulator": dynamic(() => import("./tools/tool-simulator")),
  "number-collision": dynamic(() => import("./tools/tool-number-collision")),
  "latest-point-cut": dynamic(() => import("./tools/tool-latest-point-cut")),
  "global-stats": dynamic(() => import("./tools/tool-global-stats")),
  "029-point-dead": dynamic(() => import("./tools/tool-029-point-dead")),
  "032-single-dead-16": dynamic(() => import("./tools/tool-032-single-dead-16")),
  "033-pair-dead-8": dynamic(() => import("./tools/tool-033-pair-dead-8")),
  "034-custom-pair-dead": dynamic(() => import("./tools/tool-034-custom-pair-dead")),
  "036-featured-8": dynamic(() => import("./tools/tool-036-featured-8")),
  "038-compare-tens-pin": dynamic(() => import("./tools/tool-038-compare-tens-pin")),
  "039-parity-pair-dead": dynamic(() => import("./tools/tool-039-parity-pair-dead")),
  "040-featured-7": dynamic(() => import("./tools/tool-040-featured-7")),
};

export function ToolRouter({ slug }: { slug: string }) {
  const Component = componentMap[slug];
  if (!Component) return <div className="text-center text-ink/50 py-12">ไม่พบเครื่องมือ</div>;
  return <Component />;
}

export function hasReactComponent(slug: string): boolean {
  return slug in componentMap;
}
