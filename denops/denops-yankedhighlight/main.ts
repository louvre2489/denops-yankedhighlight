import { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import { decorate } from "https://deno.land/x/denops_std@v3.3.0/buffer/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.3.0/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.3.0/function/mod.ts";
import * as helper from "./helper.ts";
import * as variable from "./variable.ts";
import { Decorator } from "./types.ts";

export async function main(denops: Denops): Promise<void> {
  // Highlight key
  const hiColorKey: string = "YankedHighlight";

  const yankOperation: string = "y";

  // key-code of blockwise-operatioin
  const blockwiseOperatioin: number = 22;

  // head column
  const firstCol: number = 1;

  denops.dispatcher = {
    async yanked(): Promise<void> {
      // Opration command
      let operator = await helper.operator(denops);

      if (operator !== yankOperation) {
        return;
      }

      // List of yanked text
      let contents = await helper.regcontens(denops);

      // Regtype
      let type = await helper.regtype(denops);

      // Cursor position
      let cursorLine = await helper.currentLine(denops);
      let cursorCol = await helper.currentColumn(denops);

      // start highlight
      highlight(type, contents, cursorLine, cursorCol);
    },
  };

  async function highlight(
    type: string,
    contents: string[],
    cursorLine: number,
    cursorCol: number,
  ): Promise<void> {

    // Highlight color
    let hiBgColor = await variable.highlightBgColor(denops);
    let hiFgColor = await variable.highlightFgColor(denops);
    await denops.cmd(
      `highlight ${hiColorKey} ctermbg = ${hiBgColor} ctermfg = ${hiFgColor}`,
    );

    let yankedLine = cursorLine;

    let decs = new Array();

    for (let yankedText of contents) {
      let targetLineText = await helper.text(denops, yankedLine);
      let startCol = calcStartCol(yankedText, targetLineText)
        ? firstCol
        : cursorCol;

      decs.push(createDecorator(yankedLine, startCol, yankedText));

      yankedLine++;
    }

    // Highlight
    yankHighlight(decs, cursorLine, yankedLine);

    /**
     * Calculate highlight start position(first column or middle of the line)
     */
    function calcStartCol(
      yankedText: string,
      targetLineText: string,
    ): boolean {
      if (isBlockwiseOperation(type)) {
        // When blockwise-operation
        return false;
      } else if (
        (isInitLine(yankedLine, cursorLine)) &&
        !isSameText(yankedText, targetLineText)
      ) {
        // When first line & highlight in the middle of the col
        return false;
      }

      return true;
    }
  }

  /*
   * If the beginning of regtype is 22, it's blockwise-operatioin
   */
  function isBlockwiseOperation(regtype: string): boolean {
    return regtype.charCodeAt(0) === blockwiseOperatioin;
  }

  function isSameText(yankedText: string, lineText: string): boolean {
    return yankedText === lineText;
  }

  function isInitLine(startLine: number, yankedLine: number): boolean {
    return startLine === yankedLine;
  }

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
    let bufNr = await fn.bufnr(denops) as number;

    await decorate(denops, bufNr, decs);

    let highlightDuration = await variable.highlightDuration(denops);

    // Stop highlight
    setTimeout(() => {
      denops.eval(
        `nvim_buf_clear_namespace(${bufNr}, -1, ${startLine - 1}, ${endLine})`,
      );
    }, highlightDuration);
  }

  /**
   * autocmd
   */
  const calledMethod = "yanked";
  await autocmd.define(
    denops,
    "TextYankPost",
    "*",
    `call denops#request('${denops.name}', '${calledMethod}', [])`,
  );
}
