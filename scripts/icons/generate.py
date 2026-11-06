import sys, os, re, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from source import ICONS as BASE
from extra import EXTRA
ICONS = dict(BASE)
ICONS.update(EXTRA)          # new/updated icons override the base set

SRC = os.path.abspath(os.path.join(HERE, '..', '..'))

def to_jsx(markup: str) -> str:
    # SVG attributes (kebab-case) -> React props (camelCase). Only attribute names are touched.
    def camel(m):
        name = re.sub(r'-([a-z])', lambda x: x.group(1).upper(), m.group(1))
        return f'{name}='
    return re.sub(r'\b([a-z]+(?:-[a-z]+)+)=', camel, markup)

for k, v in ICONS.items():
    # ensure every <defs> id is unique to its icon
    ids = re.findall(r'id="([^"]+)"', v)
    assert len(ids) == len(set(ids)), f'duplicate id in {k}'

names = list(ICONS.keys())
union = '|'.join(f'"{n}"' for n in names)
cases = '\n'.join(f'    case "{n}":\n      return (<>{to_jsx(ICONS[n])}</>);' for n in names)
tsx = f'''import React from 'react';

/**
 * مجموعه‌ی آیکون چندبوم. شبکه‌ی ۲۴. آیکون‌های ساده با currentColor و متغیرهای --icon-soft / --icon-accent.
 * آیکون‌های براق (ai، goals، quest، forecast، vip-crown) گرادیانت ثابت سبز دارند تا در هر تم یکسان بمانند.
 * تولیدشده از منبع واحد: icons/source.py + icons/extra.py + icons/generate.py
 */
export type ChandIconName = {union};

export interface ChandIconProps {{
  name: ChandIconName;
  size?: number;
  className?: string;
  title?: string;
}}

const ICON_CONTENT = (name: ChandIconName): React.ReactElement => {{
  switch (name) {{
{cases}
    default:
      return <></>;
  }}
}};

export const ChandIcon: React.FC<ChandIconProps> = ({{ name, size, className, title }}) => (
  <svg
    viewBox="0 0 24 24"
    width={{size}}
    height={{size}}
    className={{className}}
    fill="none"
    stroke="currentColor"
    strokeWidth={{1.8}}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={{title ? 'img' : undefined}}
    aria-hidden={{title ? undefined : true}}
    aria-label={{title}}
    focusable="false"
    data-icon={{name}}
  >
    {{title && <title>{{title}}</title>}}
    {{ICON_CONTENT(name)}}
  </svg>
);

export default ChandIcon;
'''
open(f'{SRC}/src/components/icons/ChandIcon.tsx', 'w', encoding='utf-8').write(tsx)

# static SVG files (light and dark), with CSS variables resolved to hex
THEMES = {'light': {'stroke': '#059669', 'soft': '#D1FAE5', 'accent': '#10B981'},
          'dark':  {'stroke': '#34D399', 'soft': '#0F3D2E', 'accent': '#34D399'}}
for theme, c in THEMES.items():
    os.makedirs(f'{SRC}/public/icons/{theme}', exist_ok=True)
    for n, v in ICONS.items():
        body = v.replace('var(--icon-soft)', c['soft']).replace('var(--icon-accent)', c['accent']).replace('currentColor', c['stroke'])
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" '
               f'stroke="{c["stroke"]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{body}</svg>\n')
        open(f'{SRC}/public/icons/{theme}/{n}.svg', 'w', encoding='utf-8').write(svg)
print('generated', len(ICONS), 'icons')
