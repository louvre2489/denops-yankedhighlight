import { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import {
  globals,
  vim,
} from "https://deno.land/x/denops_std@v3.3.0/variable/mod.ts";

export async function operator(denops: Denops): Promise<string> {
  return (await vim.get(denops, "event.operator")) as string;
}

export async function regcontens(denops: Denops): Promise<Array<string>> {
  return (await vim.get(denops, "event.regcontents")) as Array<string>;
}

export async function regtype(denops: Denops): Promise<string> {
  return (await vim.get(denops, "event.regtype")) as string;
}

export async function currentLine(denops: Denops): Promise<number> {
  return (await denops.eval(`line(".")`)) as number;
}

export async function currentColumn(denops: Denops): Promise<number> {
  return (await denops.eval(`col(".")`)) as number;
}

export async function text(denops: Denops, line: number): Promise<string> {
  return (await denops.eval(`getline("${line}")`)) as string;
}

export async function globalVariable<T>(
  denops: Denops,
  key: string,
): Promise<T | null> {
  return (await globals.get(denops, key));
}
