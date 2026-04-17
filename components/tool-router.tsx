"use client";

import dynamic from "next/dynamic";
import { type ComponentType } from "react";

/* Dynamic imports for all tool components – code-split per route */
const componentMap: Record<string, ComponentType> = {
  "001-hundreds-cut": dynamic(() => import("./tools/tool-001-hundreds-cut")),
  "002-low-probability": dynamic(() => import("./tools/tool-002-low-probability")),
  "003-all-in-one": dynamic(() => import("./tools/tool-003-all-in-one")),
  "004-hell-pairs": dynamic(() => import("./tools/tool-004-hell-pairs")),
  "005-three-pair-formulas": dynamic(() => import("./tools/tool-005-three-pair-formulas")),
  "006-green-three": dynamic(() => import("./tools/tool-006-green-three")),
  "007-five-plus-one": dynamic(() => import("./tools/tool-007-five-plus-one")),
  "008-cross-polarity": dynamic(() => import("./tools/tool-008-cross-polarity")),
  "009-three-dead-pairs": dynamic(() => import("./tools/tool-009-three-dead-pairs")),
  "010-three-think": dynamic(() => import("./tools/tool-010-three-think")),
  "011-direct-cut-4": dynamic(() => import("./tools/tool-011-direct-cut-v9")),
  "012-direct-cut-v2": dynamic(() => import("./tools/tool-012-direct-cut-v2")),
  "013-direct-cut": dynamic(() => import("./tools/tool-013-direct-cut")),
  "014-seven-bottom-three": dynamic(() => import("./tools/tool-014-seven-bottom-three")),
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
  "023-parity-gap": dynamic(() => import("./tools/tool-023-parity-gap")),
  "024-mirror-dead": dynamic(() => import("./tools/tool-024-mirror-dead")),
  "025-chain-break": dynamic(() => import("./tools/tool-025-chain-break")),
  "026-digit-sum-pos": dynamic(() => import("./tools/tool-026-digit-sum-pos")),
  "027-rotation-dead": dynamic(() => import("./tools/tool-027-rotation-dead")),
  "028-fibonacci-dead": dynamic(() => import("./tools/tool-028-fibonacci-dead")),
  "029-point-dead": dynamic(() => import("./tools/tool-029-point-dead")),
  "030-tens-dead": dynamic(() => import("./tools/tool-030-tens-dead")),
  "031-units-dead": dynamic(() => import("./tools/tool-031-units-dead")),
  "032-single-dead-16": dynamic(() => import("./tools/tool-032-single-dead-16")),
  "033-pair-dead-8": dynamic(() => import("./tools/tool-033-pair-dead-8")),
  "034-custom-pair-dead": dynamic(() => import("./tools/tool-034-custom-pair-dead")),
  "035-combined-point-dead": dynamic(() => import("./tools/tool-035-combined-point-dead")),
  "036-featured-8": dynamic(() => import("./tools/tool-036-featured-8")),
  "037-mega-dead": dynamic(() => import("./tools/tool-037-mega-dead")),
};

export function ToolRouter({ slug }: { slug: string }) {
  const Component = componentMap[slug];
  if (!Component) return <div className="text-center text-ink/50 py-12">ไม่พบเครื่องมือ</div>;
  return <Component />;
}

export function hasReactComponent(slug: string): boolean {
  return slug in componentMap;
}
