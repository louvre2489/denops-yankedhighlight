import { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import { decorate } from "https://deno.land/x/denops_std@v3.3.0/buffer/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.3.0/autocmd/mod.ts";
import * as helper from "./helper.ts";
import { Decorator } from "./types.ts";

export async function main(denops: Denops): Promise<void> {
  // ヤンクされた箇所の色を変更する
  const hiColorKey: string = "YankedHighlight";

  //  const hiBgColor: number = 186;
  const hiBgColor: number = 12;
  const hiFgColor: number = 16;

  // ハイライト持続期間(ms)
  const highlightTime: number = 1000;

  // head column
  const firstColumn = 1;

  const currentBufferNumber: number = 0;

  denops.dispatcher = {
    async yanked(): Promise<void> {
      // Opration command
      let operator = await helper.operator(denops);

      if (operator !== "y") {
        return;
      }

      // List of yanked text
      let regcontents = await helper.regcontens(denops);

      // Regtype
      let regtype = await helper.regtype(denops);

      // Highlight color
      await denops.cmd(
        `highlight ${hiColorKey} ctermbg = ${hiBgColor} ctermfg = ${hiFgColor}`,
      );

      // Cursor position
      let line = await helper.currentLine(denops);
      let col = await helper.currentColumn(denops);

      if (regcontents.length === 1) {
        // Yanked single Line

        let yankedText = regcontents[0];
        let cursorLineText = await helper.text(denops, line);

        if (yankedText === cursorLineText) {
          // yy
          // Highlight all characters in current line

          let dec: Array<Decorator> = Array(createDecorator(line, firstColumn, cursorLineText))

          await decorate(denops, 0, dec);

//          await yankHighlight(
//            currentBufferNumber,
//            line,
//            firstColumn,
//            textLength(cursorLineText),
//          );
        } else {
          // yaw, y2w, etc...
          // Highlight the number of characters that is yanked from the current cursor position
          await yankHighlight(
            currentBufferNumber,
            line,
            col,
            textLength(yankedText),
          );
        }
      } else {
        // Yanked multi line
        let targetLine = line;

        for (let yankedText of regcontents) {
          let targetLineText =
            (await denops.eval(`getline("${targetLine}")`)) as string;

          if (regtype.charCodeAt(0) === 22) {
            // If the beginning of regtype is 22, it's blockwise-operatioin
            console.log(yankedText);
            await yankHighlight(
              currentBufferNumber,
              targetLine,
              col,
              textLength(yankedText),
            );
          } else {
            if (yankedText === targetLineText) {
              // Highlight all characters in the line
              await yankHighlight(
                currentBufferNumber,
                targetLine,
                firstColumn,
                textLength(targetLineText),
              );
            } else {
              if (targetLine === line) {
                // Highlight first line
                await yankHighlight(
                  currentBufferNumber,
                  targetLine,
                  col,
                  textLength(yankedText),
                );
              } else {
                // Highlight multi-line yank
                await yankHighlight(
                  currentBufferNumber,
                  targetLine,
                  firstColumn,
                  textLength(yankedText),
                );
              }
            }
          }

          targetLine++;
        }
      }
    },
  };

  /**
   * マルチバイト時の考慮をしつつハイライト範囲となる文字数を取得する
   */
  function textLength(text: string): number {
    return encodeURI(text).replace(/%../g, "*").length;
  }

  function createDecorator(line: number, col: number, text: string): Decorator {
    let dec: Decorator = {
      line: line,
      column: col,
      length: textLength(text),
      highlight: hiColorKey,
    };

    return dec;
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
