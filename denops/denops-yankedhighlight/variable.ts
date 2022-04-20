import { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import { globalVariable } from "./helper.ts";

/**
 * Highlight Duration(ms)
 */
const k_HighlightDuration = "yankedhighlight_duration";
const defaultHighlightDuration = 1000;

export async function highlightDuration(denops: Denops): Promise<number> {
  let duration = await globalVariable<number>(denops, k_HighlightDuration);

  if (duration === null) {
    return defaultHighlightDuration;
  } else if (duration < 0) {
    return 0;
  }

  return duration;
}

/**
 * Highlight Background Color
 */
const k_HighlightBgColor = "yankedhighlight_bg_color";
const defaultHighlightBgColor = 228;

export async function highlightBgColor(denops: Denops): Promise<number> {
  let bgColor = await globalVariable<number>(denops, k_HighlightBgColor);

  if (bgColor === null) {
    return defaultHighlightBgColor;
  }

  return bgColor;
}
/**
 * Highlight Foreground Color
 */
const k_HighlightFgColor = "yankedhighlight_fg_color";
const defaultHighlightFgColor = 16;

export async function highlightFgColor(denops: Denops): Promise<number> {
  let fgColor = await globalVariable<number>(denops, k_HighlightFgColor);

  if (fgColor === null) {
    return defaultHighlightFgColor;
  }

  return fgColor;
}
