import React from 'react';
import { Rune } from './Rune';

interface Tab {
  key: string;
  label: string;
  glyph?: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Tabs({
  tabs,
  active,
  onChange,
  className = '',
  style,
}: TabsProps) {
  return (
    <div className={`ao-tabs ${className}`} style={style} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          className={`ao-tab ${active === tab.key ? 'ao-tab--active' : ''}`}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          {tab.glyph && <Rune kind={tab.glyph} size={14} />}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
