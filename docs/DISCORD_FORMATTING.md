# Discord Formatting Support

The live chat now supports full Discord markdown formatting and custom emojis!

## Supported Formatting

### Text Formatting

| Syntax | Result | Example |
|--------|--------|---------|
| `**text**` | **Bold** | `**Chargin' Targe**` |
| `*text*` or `_text_` | *Italic* | `*emphasis*` |
| `__text__` | **Bold** (alternative) | `__important__` |
| `~~text~~` | ~~Strikethrough~~ | `~~mistake~~` |
| `` `text` `` | `Inline code` | `` `console.log()` `` |
| `||text||` | Spoiler (hover to reveal) | `||secret||` |

### Code Blocks

```
\`\`\`javascript
function hello() {
  console.log("Hello!");
}
\`\`\`
```

Renders as a syntax-highlighted code block.

### Custom Discord Emojis

Discord custom emojis are automatically rendered:
- Static: `<:emoji_name:123456789>`
- Animated: `<a:emoji_name:123456789>`

These will display as inline images from Discord's CDN.

### Unicode Emojis

Standard Unicode emojis work naturally: 😀 🎮 💬 ⚔️

## Styling

All formatted elements use the site's design system:
- **Bold text**: White color for emphasis
- **Code**: Cyan-tinted background with monospace font
- **Spoilers**: Gray background that becomes transparent on hover
- **Code blocks**: Glass morphism container with syntax highlighting

## Implementation

The formatter is located at `src/lib/discord-formatter.tsx` and processes:
1. Code blocks (```code```)
2. Custom Discord emojis (<:name:id>)
3. Inline markdown (bold, italic, etc.)
4. Spoilers and special formatting

Messages are automatically formatted in the `LiveChat` component using the `formatDiscordMessage()` function.

## Examples

### Input:
```
**Chargin' Targe** is a *great* weapon!
Use `tf_weapon_shield` to equip it.
||The damage is 50||
```

### Output:
**Chargin' Targe** is a *great* weapon!
Use `tf_weapon_shield` to equip it.
<span style="background: gray; padding: 2px;">The damage is 50</span> (hover to reveal)

## Browser Compatibility

All formatting features work in modern browsers with full CSS support for:
- Flexbox
- CSS transitions
- Backdrop filters (glass morphism)
- Unicode emoji rendering
