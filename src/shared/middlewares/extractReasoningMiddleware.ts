/**
 * 提取推理中间件
 * 用于从流式响应中提取推理内容
 * 修改自 https://github.com/vercel/ai/blob/845080d80b8538bb9c7e527d2213acb5f33ac9c2/packages/ai/core/middleware/extract-reasoning-middleware.ts
 */

import { getPotentialStartIndex } from '../utils/getPotentialIndex';

/**
 * 提取推理中间件选项
 */
export interface ExtractReasoningMiddlewareOptions {
  openingTag: string;
  closingTag: string;
  separator?: string;
  enableReasoning?: boolean;
}



/**
 * 转义正则表达式特殊字符
 * @param str 字符串
 * @returns 转义后的字符串
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

/**
 * 提取推理中间件
 * @param options 选项
 * @returns 中间件
 */
export function extractReasoningMiddleware<
  T extends { type: string } & (
    | { type: 'text-delta' | 'reasoning'; textDelta: string }
    | { type: string } // 其他类型
  ) = { type: string; textDelta: string }
>({ openingTag, closingTag, separator = '\n', enableReasoning = true }: ExtractReasoningMiddlewareOptions) {
  const openingTagEscaped = escapeRegExp(openingTag);
  const closingTagEscaped = escapeRegExp(closingTag);

  return {
    /**
     * 包装生成函数
     * @param doGenerate 生成函数
     * @returns 包装后的结果
     */
    wrapGenerate: async ({ doGenerate }: { doGenerate: () => Promise<{ text: string } & Record<string, any>> }) => {
      const { text: rawText, ...rest } = await doGenerate();
      if (rawText == null) {
        return { text: rawText, ...rest };
      }

      const text = rawText;
      const regexp = new RegExp(`${openingTagEscaped}(.*?)${closingTagEscaped}`, 'gs');
      const matches = Array.from(text.matchAll(regexp));

      if (!matches.length) {
        return { text, ...rest };
      }

      const reasoning = matches.map((match: RegExpMatchArray) => match[1]).join(separator);
      let textWithoutReasoning = text;

      for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i] as RegExpMatchArray;
        const beforeMatch = textWithoutReasoning.slice(0, match.index as number);
        const afterMatch = textWithoutReasoning.slice((match.index as number) + match[0].length);
        textWithoutReasoning =
          beforeMatch + (beforeMatch.length > 0 && afterMatch.length > 0 ? separator : '') + afterMatch;
      }

      return { ...rest, text: textWithoutReasoning, reasoning };
    },

    /**
     * 包装流
     * @param doStream 流函数
     * @returns 包装后的流
     */
    wrapStream: async ({ doStream }: { doStream: () => Promise<{ stream: ReadableStream<T> } & Record<string, any>> }) => {
      const { stream, ...rest } = await doStream();

      if (!enableReasoning) {
        return { stream, ...rest };
      }

      let isFirstReasoning = true;
      let isFirstText = true;
      let afterSwitch = false;
      let isReasoning = false;
      let buffer = '';

      return {
        stream: stream.pipeThrough(
          new TransformStream<T, T>({
            transform: (chunk, controller) => {
              // 处理非文本增量类型的块
              if (chunk.type !== 'text-delta') {
                controller.enqueue(chunk);
                return;
              }

              // textDelta 只在 text-delta/reasoning chunk 上
              buffer += (chunk as { textDelta: string }).textDelta;

              function publish(text: string) {
                if (text.length > 0) {
                  const prefix = afterSwitch && (isReasoning ? !isFirstReasoning : !isFirstText) ? separator : '';
                  controller.enqueue({
                    ...chunk,
                    type: isReasoning ? 'reasoning' : 'text-delta',
                    textDelta: prefix + text
                  } as T);
                  afterSwitch = false;
                  if (isReasoning) {
                    isFirstReasoning = false;
                  } else {
                    isFirstText = false;
                  }
                }
              }

              while (true) {
                const nextTag = isReasoning ? closingTag : openingTag;
                const startIndex = getPotentialStartIndex(buffer, nextTag);

                if (startIndex == null) {
                  publish(buffer);
                  buffer = '';
                  break;
                }

                publish(buffer.slice(0, startIndex));
                const foundFullMatch = startIndex + nextTag.length <= buffer.length;

                if (foundFullMatch) {
                  buffer = buffer.slice(startIndex + nextTag.length);
                  isReasoning = !isReasoning;
                  afterSwitch = true;
                } else {
                  buffer = buffer.slice(startIndex);
                  break;
                }
              }
            }
          })
        ),
        ...rest
      };
    }
  };
}
