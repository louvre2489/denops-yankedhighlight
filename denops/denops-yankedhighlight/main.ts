import { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import { decorate } from "https://deno.land/x/denops_std@v3.3.0/buffer/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.3.0/autocmd/mod.ts";
import * as helper from "./helper.ts";
import { Decorator } from "./types.ts";

export async function main(denops: Denops): Promise<void> {
  // Highlight key
  const hiColorKey: string = "YankedHighlight";

  //  const hiBgColor: number = 186;
  const hiBgColor: number = 12;
  const hiFgColor: number = 16;

  // Highlight duration(ms)
  const highlightTime: number = 1000;

  // head column
  const firstCol = 1;

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

          let dec: Array<Decorator> = Array(
            createDecorator(line, firstCol, cursorLineText),
          );

          yankHighlight(dec, line, line);
        } else {
          // yaw, y2w, etc...
          // Highlight the number of characters that is yanked from the current cursor position
          let dec: Array<Decorator> = Array(
            createDecorator(line, col, yankedText),
          );

          yankHighlight(dec, line, line);
        }
      } else {
        // Yanked multi line
        let yankedLine = line;

        let decs = new Array();

        for (let yankedText of regcontents) {
          let targetLineText = await helper.text(denops, yankedLine);

          if (regtype.charCodeAt(0) === 22) {
            // If the beginning of regtype is 22, it's blockwise-operatioin
            decs.push(createDecorator(yankedLine, col, yankedText));
          } else {
            // multi-line yank other than blockwise-operation
            if (yankedText === targetLineText) {
              // Highlight all characters in the line
              decs.push(createDecorator(yankedLine, firstCol, targetLineText));
            } else {
              if (yankedLine === line) {
                // First line, highlight at current col
                decs.push(createDecorator(yankedLine, col, yankedText));
              } else {
                // Highlight multi-line yank
                decs.push(createDecorator(yankedLine, firstCol, yankedText));
              }
            }
          }

          yankedLine++;
        }

        yankHighlight(decs, line, yankedLine);
      }
    },
  };

  /**
   * Get the number of characters in the highlight range while considering multibyte
   */
  function textLength(text: string): number {
    return encodeURI(text).replace(/%../g, "*").length;
  }

  /**
   * Create object for highlight
   */
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
   * Highlight characters that is yanked
   */
  async function yankHighlight(
    decs: Array<Decorator>,
    startLine: number,
    endLine: number,
  ): Promise<void> {
    await decorate(denops, currentBufferNumber, decs);

    // Stop highlight
    setTimeout(() => {
      denops.eval(
        `nvim_buf_clear_namespace(${currentBufferNumber}, -1, ${
          startLine - 1
        }, ${endLine})`,
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
