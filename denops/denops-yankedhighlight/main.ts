import { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.3.0/function/mod.ts";
import { decorate } from "https://deno.land/x/denops_std@v3.3.0/buffer/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.3.0/autocmd/mod.ts";
import { vim } from "https://deno.land/x/denops_std@v3.3.0/variable/mod.ts";

export async function main(denops: Denops): Promise<void> {
  // ヤンクされた箇所の色を変更する
  const hiColorKey = "YankedHighlight";
  //  const hiBgColor = 186;
  const hiBgColor = 12;
  const hiFgColor = 16;

  // ハイライト持続期間(ms)
  const highlightTime = 1000;

  /**
   * TextYankPostで取得した内容で判断する
   * - リスト要素が１つ
   *   - 該当行の文字数＝要素の文字数の場合はyyなので、行全体をハイライトする
   *   - それ以外の場合は単一行内でのywやy3wなどなので、カーソル位置から要素の文字数分ハイライトする
   * - リスト要素が複数
   *   - 複数行にわたるヤンクなので、行ごとにカーソル位置から要素の文字数分ハイライトする
   *     - visual mode
   *     - 矩形 mode
   *     - y9y
   */
  denops.dispatcher = {
    async yanked(): Promise<void> {
      // Opration command
      let operator = await vim.get(denops, "event.operator");

      if (operator !== "y") {
        return;
      }

      // List of yanked text
      let regcontents = (await vim.get(denops, "event.regcontents")) as Array<string>;

      // Highlight color
      await denops.cmd(
        `highlight ${hiColorKey} ctermbg = ${hiBgColor} ctermfg = ${hiFgColor}`,
      );

      if (regcontents.length === 1) {
        // Yanked single Line

        let yankedText = regcontents[0];
        let cursorLineText = (await denops.eval(`getline(".")`)) as string;

        // Cursor position
        let line = (await denops.eval(`line(".")`)) as number;
        let col = ((await denops.eval(`col(".")`)) as number);

        const bufnr = await fn.bufnr(denops) as number;

        if (yankedText === cursorLineText) {
          // Highlight all characters in current line
          await yankHighlight(bufnr, line, 1, textLength(cursorLineText));
        } else {
          // Highlight the number of characters that is yanked from the current cursor position
          await yankHighlight(bufnr, line, col, textLength(yankedText));
        }
      } else {
        // Yanked multi line
      }
    },
  };

  /**
   * マルチバイト時の考慮をしつつハイライト範囲となる文字数を取得する
   */
  function textLength(text:string): number {
    return encodeURI(text).replace(/%../g, "*").length;
  }

  /**
   * 指定した範囲をハイライトする
   */
  async function yankHighlight(
    bufnr: number,
    line: number,
    col: number,
    len: number,
  ): Promise<void> {
    await decorate(denops, bufnr, [
      {
        line: line,
        column: col,
        length: len,
        highlight: hiColorKey,
      },
    ]);

    // 指定時間後にハイライトを削除する
    setTimeout(() => {
      denops.eval(
        `nvim_buf_clear_namespace(${bufnr}, -1, ${line - 1}, ${line})`,
      );
    }, highlightTime);
  }

  /**
   * autocmd
   */
  await autocmd.define(
    denops,
    "TextYankPost",
    "*",
    `call denops#request('${denops.name}', 'yanked', [])`,
  );
}

