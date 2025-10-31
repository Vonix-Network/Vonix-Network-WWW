/**
 * Discord Markdown Formatter
 * Converts Discord markdown syntax to React elements
 * Supports: bold, italic, underline, strikethrough, code, spoilers, and emojis
 */

import React from 'react';

interface DiscordEmoji {
  name: string;
  id: string;
  animated?: boolean;
}

/**
 * Parse Discord custom emoji syntax: <:name:id> or <a:name:id>
 */
function parseCustomEmoji(text: string): (string | React.ReactElement)[] {
  const emojiRegex = /<(a)?:(\w+):(\d+)>/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = emojiRegex.exec(text)) !== null) {
    // Add text before emoji
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const [fullMatch, animated, name, id] = match;
    const extension = animated ? 'gif' : 'png';
    const emojiUrl = `https://cdn.discordapp.com/emojis/${id}.${extension}?size=32&quality=lossless`;

    parts.push(
      <img
        key={`emoji-${id}-${match.index}`}
        src={emojiUrl}
        alt={`:${name}:`}
        title={`:${name}:`}
        className="inline-block w-5 h-5 align-middle mx-0.5"
      />
    );

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Parse Discord markdown formatting
 * Supports: **bold**, *italic*, __underline__, ~~strikethrough~~, `code`, ||spoiler||
 */
export function parseDiscordMarkdown(text: string): React.ReactElement {
  if (!text) return <></>;

  // First, handle custom emojis
  const emojiParts = parseCustomEmoji(text);
  
  // Process each part for markdown
  const processedParts = emojiParts.map((part, partIndex) => {
    if (typeof part !== 'string') {
      return part; // Already a React element (emoji)
    }

    // Split by markdown patterns while preserving the delimiters
    const segments: (string | React.ReactElement)[] = [];
    let remaining = part;
    let segmentKey = 0;

    // Process markdown in order of precedence
    const patterns = [
      // Spoilers ||text||
      {
        regex: /\|\|(.+?)\|\|/g,
        render: (content: string, key: number) => (
          <span
            key={`spoiler-${partIndex}-${key}`}
            className="bg-gray-800 hover:bg-transparent transition-colors cursor-pointer px-1 rounded"
            title="Spoiler (hover to reveal)"
          >
            {content}
          </span>
        ),
      },
      // Bold **text** or __text__
      {
        regex: /\*\*(.+?)\*\*|__(.+?)__/g,
        render: (content: string, key: number) => (
          <strong key={`bold-${partIndex}-${key}`} className="font-bold text-white">
            {content}
          </strong>
        ),
      },
      // Italic *text* or _text_
      {
        regex: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g,
        render: (content: string, key: number) => (
          <em key={`italic-${partIndex}-${key}`} className="italic">
            {content}
          </em>
        ),
      },
      // Strikethrough ~~text~~
      {
        regex: /~~(.+?)~~/g,
        render: (content: string, key: number) => (
          <span key={`strike-${partIndex}-${key}`} className="line-through opacity-75">
            {content}
          </span>
        ),
      },
      // Inline code `text`
      {
        regex: /`(.+?)`/g,
        render: (content: string, key: number) => (
          <code
            key={`code-${partIndex}-${key}`}
            className="bg-gray-800/60 text-brand-cyan px-1.5 py-0.5 rounded text-sm font-mono"
          >
            {content}
          </code>
        ),
      },
    ];

    // Apply all patterns
    let processedText: (string | React.ReactElement)[] = [remaining];

    for (const pattern of patterns) {
      const newProcessed: (string | React.ReactElement)[] = [];

      for (const item of processedText) {
        if (typeof item !== 'string') {
          newProcessed.push(item);
          continue;
        }

        let lastIndex = 0;
        let match;
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

        while ((match = regex.exec(item)) !== null) {
          // Add text before match
          if (match.index > lastIndex) {
            newProcessed.push(item.slice(lastIndex, match.index));
          }

          // Add formatted element
          const content = match[1] || match[2]; // Handle both capture groups
          if (content) {
            newProcessed.push(pattern.render(content, segmentKey++));
          }

          lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < item.length) {
          newProcessed.push(item.slice(lastIndex));
        }
      }

      processedText = newProcessed;
    }

    return processedText;
  });

  // Flatten all parts
  const flattenedParts = processedParts.flat();

  return (
    <span className="discord-formatted">
      {flattenedParts.map((part, index) => (
        <React.Fragment key={`part-${index}`}>{part}</React.Fragment>
      ))}
    </span>
  );
}

/**
 * Convert Unicode emojis to Twemoji images for consistent display
 */
export function convertUnicodeEmojis(text: string): React.ReactElement {
  // This is a simplified version - you can enhance with a full emoji library
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = emojiRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const emoji = match[0];
    const codePoint = emoji.codePointAt(0)?.toString(16).padStart(4, '0');
    
    if (codePoint) {
      parts.push(
        <span key={`emoji-${match.index}`} className="inline-block" title={emoji}>
          {emoji}
        </span>
      );
    }

    lastIndex = match.index + emoji.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

/**
 * Main formatter that combines all Discord formatting features
 */
export function formatDiscordMessage(content: string): React.ReactElement {
  if (!content) return <></>;

  // Handle code blocks first (```language\ncode```)
  const codeBlockRegex = /```(\w+)?\n?([\s\S]+?)```/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let blockKey = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block (with markdown formatting)
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      parts.push(parseDiscordMarkdown(textBefore));
    }

    const language = match[1] || 'text';
    const code = match[2];

    parts.push(
      <pre
        key={`codeblock-${blockKey++}`}
        className="bg-gray-900/80 border border-brand-cyan/20 rounded-lg p-4 my-2 overflow-x-auto"
      >
        <code className="text-sm font-mono text-gray-300">{code}</code>
      </pre>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text with markdown formatting
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    parts.push(parseDiscordMarkdown(remaining));
  }

  // If no code blocks were found, just parse markdown
  if (parts.length === 0) {
    return parseDiscordMarkdown(content);
  }

  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={`block-${index}`}>{part}</React.Fragment>
      ))}
    </>
  );
}
