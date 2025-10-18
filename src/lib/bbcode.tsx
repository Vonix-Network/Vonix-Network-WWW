'use client';

import React from 'react';

// Enterprise-grade BBCode parser with security features
interface BBCodeNode {
  type: 'text' | 'tag';
  content: string;
  tag?: string;
  attributes?: Record<string, string>;
  children?: BBCodeNode[];
}

// Whitelist of allowed BBCode tags for security
const ALLOWED_TAGS = new Set([
  'b', 'i', 'u', 's', 'strong', 'em', 'del',
  'code', 'pre', 'quote', 'spoiler',
  'color', 'size', 'font',
  'url', 'link', 'email',
  'img', 'youtube', 'video',
  'list', 'ul', 'ol', 'li', '*',
  'center', 'left', 'right',
  'table', 'tr', 'td', 'th'
]);

// Allowed URL protocols for security
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

// Sanitize URL to prevent XSS
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return '#';
    }
    return url;
  } catch {
    return '#';
  }
}

// Sanitize text content to prevent XSS
function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Parse BBCode into AST
function parseBBCode(input: string): BBCodeNode[] {
  const nodes: BBCodeNode[] = [];
  let i = 0;
  
  while (i < input.length) {
    const openIndex = input.indexOf('[', i);
    
    if (openIndex === -1) {
      // No more tags, add remaining text
      if (i < input.length) {
        nodes.push({
          type: 'text',
          content: input.slice(i)
        });
      }
      break;
    }
    
    // Add text before tag
    if (openIndex > i) {
      nodes.push({
        type: 'text',
        content: input.slice(i, openIndex)
      });
    }
    
    const closeIndex = input.indexOf(']', openIndex);
    if (closeIndex === -1) {
      // Malformed tag, treat as text
      nodes.push({
        type: 'text',
        content: input.slice(openIndex)
      });
      break;
    }
    
    const tagContent = input.slice(openIndex + 1, closeIndex);
    const isClosingTag = tagContent.startsWith('/');
    
    if (isClosingTag) {
      // This is a closing tag, let parent handle it
      i = closeIndex + 1;
      break;
    }
    
    // Parse tag and attributes
    const [tagName, ...attrParts] = tagContent.split('=');
    const tag = tagName.toLowerCase();
    
    // Security check: only allow whitelisted tags
    if (!ALLOWED_TAGS.has(tag)) {
      nodes.push({
        type: 'text',
        content: input.slice(openIndex, closeIndex + 1)
      });
      i = closeIndex + 1;
      continue;
    }
    
    const attributes: Record<string, string> = {};
    if (attrParts.length > 0) {
      attributes.value = attrParts.join('=');
    }
    
    // Find closing tag
    const closingTag = `[/${tag}]`;
    const endIndex = input.indexOf(closingTag, closeIndex + 1);
    
    if (endIndex === -1) {
      // No closing tag, treat as self-closing or text
      if (['img', '*', 'br', 'hr'].includes(tag)) {
        nodes.push({
          type: 'tag',
          tag,
          attributes,
          content: '',
          children: []
        });
      } else {
        nodes.push({
          type: 'text',
          content: input.slice(openIndex, closeIndex + 1)
        });
      }
      i = closeIndex + 1;
      continue;
    }
    
    // Parse children
    const innerContent = input.slice(closeIndex + 1, endIndex);
    const children = parseBBCode(innerContent);
    
    nodes.push({
      type: 'tag',
      tag,
      attributes,
      content: innerContent,
      children
    });
    
    i = endIndex + closingTag.length;
  }
  
  return nodes;
}

// Render BBCode nodes to React elements
function renderBBCodeNode(node: BBCodeNode, index: number): React.ReactNode {
  if (node.type === 'text') {
    return <span key={index} dangerouslySetInnerHTML={{ __html: sanitizeText(node.content) }} />;
  }
  
  const { tag, attributes, children } = node;
  const childElements = children?.map((child, i) => renderBBCodeNode(child, i));
  
  switch (tag) {
    case 'b':
    case 'strong':
      return <strong key={index} className="font-bold">{childElements}</strong>;
      
    case 'i':
    case 'em':
      return <em key={index} className="italic">{childElements}</em>;
      
    case 'u':
      return <span key={index} className="underline">{childElements}</span>;
      
    case 's':
    case 'del':
      return <del key={index} className="line-through">{childElements}</del>;
      
    case 'code':
      return (
        <code key={index} className="bg-slate-800 text-blue-400 px-2 py-1 rounded font-mono text-sm">
          {childElements}
        </code>
      );
      
    case 'pre':
      return (
        <pre key={index} className="bg-slate-900 text-gray-300 p-4 rounded-lg overflow-x-auto font-mono text-sm border border-blue-500/20">
          {childElements}
        </pre>
      );
      
    case 'quote':
      return (
        <blockquote key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-900/50 rounded-r-lg my-2">
          <div className="text-gray-400 text-sm mb-1">Quote:</div>
          <div className="text-gray-300">{childElements}</div>
        </blockquote>
      );
      
    case 'spoiler':
      return (
        <details key={index} className="bg-slate-900/50 rounded-lg p-3 my-2 border border-gray-600">
          <summary className="cursor-pointer text-yellow-400 font-medium">Spoiler (click to reveal)</summary>
          <div className="mt-2 text-gray-300">{childElements}</div>
        </details>
      );
      
    case 'color':
      const color = attributes?.value;
      const safeColor = color?.match(/^#[0-9a-fA-F]{6}$|^[a-zA-Z]+$/) ? color : 'inherit';
      return <span key={index} style={{ color: safeColor }}>{childElements}</span>;
      
    case 'size':
      const size = parseInt(attributes?.value || '14');
      const safeSize = Math.max(8, Math.min(32, size)); // Clamp between 8-32px
      return <span key={index} style={{ fontSize: `${safeSize}px` }}>{childElements}</span>;
      
    case 'url':
    case 'link':
      const url = sanitizeUrl(attributes?.value || node.content);
      return (
        <a 
          key={index} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-green-400 hover:text-green-300 underline"
        >
          {childElements || url}
        </a>
      );
      
    case 'email':
      const email = attributes?.value || node.content;
      const safeEmail = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? email : '';
      return (
        <a 
          key={index} 
          href={`mailto:${safeEmail}`}
          className="text-green-400 hover:text-green-300 underline"
        >
          {childElements || safeEmail}
        </a>
      );
      
    case 'img':
      const imgUrl = sanitizeUrl(attributes?.value || node.content);
      return (
        <img 
          key={index}
          src={imgUrl}
          alt="User uploaded image"
          className="max-w-full h-auto rounded-lg my-2 border border-green-500/20"
          style={{ maxHeight: '400px' }}
          loading="lazy"
        />
      );
      
    case 'youtube':
      const videoId = attributes?.value?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
      if (videoId) {
        return (
          <div key={index} className="my-4">
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="max-w-full rounded-lg"
            />
          </div>
        );
      }
      return <span key={index}>{childElements}</span>;
      
    case 'list':
    case 'ul':
      return <ul key={index} className="list-disc list-inside my-2 space-y-1">{childElements}</ul>;
      
    case 'ol':
      return <ol key={index} className="list-decimal list-inside my-2 space-y-1">{childElements}</ol>;
      
    case 'li':
    case '*':
      return <li key={index} className="text-gray-300">{childElements}</li>;
      
    case 'center':
      return <div key={index} className="text-center">{childElements}</div>;
      
    case 'left':
      return <div key={index} className="text-left">{childElements}</div>;
      
    case 'right':
      return <div key={index} className="text-right">{childElements}</div>;
      
    case 'table':
      return (
        <table key={index} className="border-collapse border border-blue-500/20 my-4 w-full">
          <tbody>{childElements}</tbody>
        </table>
      );
      
    case 'tr':
      return <tr key={index} className="border-b border-blue-500/10">{childElements}</tr>;
      
    case 'td':
      return <td key={index} className="border border-blue-500/20 px-3 py-2 text-gray-300">{childElements}</td>;
      
    case 'th':
      return <th key={index} className="border border-blue-500/20 px-3 py-2 bg-blue-500/10 font-bold text-white">{childElements}</th>;
      
    default:
      return <span key={index}>{childElements}</span>;
  }
}

// Main BBCode component
interface BBCodeProps {
  children: string;
  className?: string;
}

export function BBCode({ children, className = '' }: BBCodeProps) {
  if (!children) return null;
  
  try {
    const nodes = parseBBCode(children);
    const elements = nodes.map((node, index) => renderBBCodeNode(node, index));
    
    return (
      <div className={`bbcode-content ${className}`}>
        {elements}
      </div>
    );
  } catch (error) {
    console.error('BBCode parsing error:', error);
    // Fallback to plain text if parsing fails
    return (
      <div className={className}>
        <span dangerouslySetInnerHTML={{ __html: sanitizeText(children) }} />
      </div>
    );
  }
}

// Helper function to strip BBCode for previews
export function stripBBCode(text: string): string {
  return text.replace(/\[\/?\w+(?:=[^\]]+)?\]/g, '');
}

// Validate BBCode syntax
export function validateBBCode(text: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const tagStack: string[] = [];
  
  const tagRegex = /\[(\/?)([\w]+)(?:=([^\]]+))?\]/g;
  let match;
  
  while ((match = tagRegex.exec(text)) !== null) {
    const [, isClosing, tagName] = match;
    const tag = tagName.toLowerCase();
    
    if (!ALLOWED_TAGS.has(tag)) {
      errors.push(`Unsupported tag: [${tagName}]`);
      continue;
    }
    
    if (isClosing) {
      if (tagStack.length === 0) {
        errors.push(`Unexpected closing tag: [/${tagName}]`);
      } else if (tagStack[tagStack.length - 1] !== tag) {
        errors.push(`Mismatched closing tag: [/${tagName}]`);
      } else {
        tagStack.pop();
      }
    } else {
      if (!['img', '*', 'br', 'hr'].includes(tag)) {
        tagStack.push(tag);
      }
    }
  }
  
  if (tagStack.length > 0) {
    errors.push(`Unclosed tags: ${tagStack.map(t => `[${t}]`).join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
