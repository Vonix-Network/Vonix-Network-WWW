'use client';

import { useState } from 'react';
import { Bold, Italic, Underline, Code, Quote, Link, Image, List, Eye } from 'lucide-react';
import { BBCode, validateBBCode } from '@/lib/bbcode';

interface BBCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function BBCodeEditor({ 
  value, 
  onChange, 
  placeholder = "Write your message...", 
  maxLength = 10000,
  className = '' 
}: BBCodeEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const insertBBCode = (openTag: string, closeTag: string = '', placeholder: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    
    const insertText = selectedText || placeholder;
    const newValue = beforeText + openTag + insertText + closeTag + afterText;
    
    onChange(newValue);
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + openTag.length + insertText.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, label: 'Bold', action: () => insertBBCode('[b]', '[/b]', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insertBBCode('[i]', '[/i]', 'italic text') },
    { icon: Underline, label: 'Underline', action: () => insertBBCode('[u]', '[/u]', 'underlined text') },
    { icon: Code, label: 'Code', action: () => insertBBCode('[code]', '[/code]', 'code here') },
    { icon: Quote, label: 'Quote', action: () => insertBBCode('[quote]', '[/quote]', 'quoted text') },
    { icon: Link, label: 'Link', action: () => insertBBCode('[url=https://example.com]', '[/url]', 'link text') },
    { icon: Image, label: 'Image', action: () => insertBBCode('[img]', '[/img]', 'https://example.com/image.jpg') },
    { icon: List, label: 'List', action: () => insertBBCode('[list]\n[*]', '\n[*]Item 2\n[*]Item 3\n[/list]', 'Item 1') },
  ];

  const validation = validateBBCode(value);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-green-500/20">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
              title={button.label}
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        
        <div className="h-6 w-px bg-gray-600 mx-2" />
        
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
            showPreview 
              ? 'bg-green-500/20 text-green-400' 
              : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
          }`}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>

      {/* Editor/Preview */}
      <div className="grid grid-cols-1 gap-4">
        {!showPreview ? (
          <div className="space-y-2">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={8}
              className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all resize-none font-mono text-sm"
            />
            
            {/* Character count and validation */}
            <div className="flex items-center justify-between text-xs">
              <div className="space-x-4">
                <span className={`${value.length > maxLength * 0.9 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {value.length} / {maxLength} characters
                </span>
                {!validation.valid && (
                  <span className="text-red-400">
                    {validation.errors.length} BBCode error{validation.errors.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {/* Validation errors */}
            {!validation.valid && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="text-red-400 text-sm font-medium mb-2">BBCode Errors:</div>
                <ul className="text-red-300 text-sm space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[200px] p-4 bg-slate-900/30 border border-green-500/20 rounded-lg">
            <div className="text-sm text-gray-400 mb-3 font-medium">Preview:</div>
            {value ? (
              <BBCode>{value}</BBCode>
            ) : (
              <div className="text-gray-500 italic">Nothing to preview...</div>
            )}
          </div>
        )}
      </div>

      {/* BBCode Help */}
      <details className="bg-slate-900/30 border border-green-500/10 rounded-lg">
        <summary className="p-3 cursor-pointer text-sm text-gray-400 hover:text-green-400 transition-colors">
          BBCode Help & Examples
        </summary>
        <div className="p-3 pt-0 text-sm text-gray-300 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-green-400 mb-2">Text Formatting:</div>
              <div className="space-y-1 font-mono text-xs">
                <div>[b]bold text[/b]</div>
                <div>[i]italic text[/i]</div>
                <div>[u]underlined text[/u]</div>
                <div>[s]strikethrough[/s]</div>
                <div>[color=red]colored text[/color]</div>
                <div>[size=16]sized text[/size]</div>
              </div>
            </div>
            <div>
              <div className="font-medium text-green-400 mb-2">Links & Media:</div>
              <div className="space-y-1 font-mono text-xs">
                <div>[url=https://example.com]link[/url]</div>
                <div>[img]https://example.com/image.jpg[/img]</div>
                <div>[youtube]https://youtube.com/watch?v=ID[/youtube]</div>
                <div>[email]user@example.com[/email]</div>
              </div>
            </div>
            <div>
              <div className="font-medium text-green-400 mb-2">Structure:</div>
              <div className="space-y-1 font-mono text-xs">
                <div>[quote]quoted text[/quote]</div>
                <div>[code]code snippet[/code]</div>
                <div>[spoiler]hidden content[/spoiler]</div>
                <div>[center]centered text[/center]</div>
              </div>
            </div>
            <div>
              <div className="font-medium text-green-400 mb-2">Lists:</div>
              <div className="space-y-1 font-mono text-xs">
                <div>[list]</div>
                <div>[*]Item 1</div>
                <div>[*]Item 2</div>
                <div>[/list]</div>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
