import { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import { decorate } from "https://deno.land/x/denops_std@v3.3.0/buffer/mod.ts";
import { vim } from "https://deno.land/x/denops_std@v3.3.0/variable/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.3.0/autocmd/mod.ts";

export async function main(denops: Denops): Promise<void> {

  // ヤンクされた箇所の色を変更する
  const hiColorKey: string = "YankedHighlight";

  //  const hiBgColor: number = 186;
  const hiBgColor: number = 12;
  const hiFgColor: number = 16;

  // ハイライト持続期間(ms)
  const highlightTime: number = 1000;

  const currentBufferNumber: number = 0;

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

      // Cursor position
      let line = (await denops.eval(`line(".")`)) as number;
      let col = ((await denops.eval(`col(".")`)) as number);

      if (regcontents.length === 1) {
        // Yanked single Line

        let yankedText = regcontents[0];
        let cursorLineText = (await denops.eval(`getline("${line}")`)) as string;

        if (yankedText === cursorLineText) {
          // Highlight all characters in current line
          const firstColumn = 1;

          await yankHighlight(currentBufferNumber, line, firstColumn, textLength(cursorLineText));
        } else {
          // Highlight the number of characters that is yanked from the current cursor position
          await yankHighlight(currentBufferNumber, line, col, textLength(yankedText));
        }
      } else {
        // Yanked multi line
        let targetLine = line;

        for (let yankedText of regcontents) {
          let targetLineText = (await denops.eval(`getline("${targetLine}")`)) as string;

          if (yankedText === targetLineText) {
            // Highlight all characters in the line
            const firstColumn = 1;

            await yankHighlight(currentBufferNumber, targetLine, firstColumn, textLength(targetLineText));
          } else {
            // 最初のラインが途中で始まるケースと最後のラインが途中で終わるケースを考慮する必要がある
            // 多分decorateに渡す情報をオブジェクトにして配列で渡すようにするのがいいんじゃないかなー
            // あとは矩形選択をどうしようか...
          }

          targetLine++;
        }
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

