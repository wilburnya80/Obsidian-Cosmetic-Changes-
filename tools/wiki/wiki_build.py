#!/usr/bin/env python3
"""Convert the pulled Kimetsu no Yaiba Wiki (Fandom) wikitext into Obsidian notes.
Usage: wiki_build.py <vaultDir>   (reads raw.json + titles.json in the cwd)
Content: Kimetsu no Yaiba Wiki, https://kimetsu-no-yaiba.fandom.com , text licensed CC BY-SA 3.0 (attribution added to every note)."""
import json, re, sys, os, collections, datetime
from urllib.parse import quote

OUT = sys.argv[1]
RAW = json.load(open('raw.json')); T = json.load(open('titles.json')); CATJ = json.load(open('/home/user/Obsidian-Cosmetic-Changes-/categories.json'))['categories']
CAT = {c['id']: c for c in CATJ}
CONTENT, CATS = RAW['content'], RAW['cats']
PAGES = set(T['pages']); REDIRS = T['redirects']
TODAY = '2026-11-16'

def norm(t):
    t = t.strip().replace('_', ' ')
    return t[:1].upper() + t[1:] if t else t

# ---------- redirect map ----------
REDIR = {}
for r in REDIRS:
    m = re.match(r'#redirect\s*\[\[([^\]|#]+)(#[^\]|]*)?', CONTENT.get(r, ''), re.I)
    if m: REDIR[r] = (norm(m.group(1)), (m.group(2) or ''))

# ---------- subpage handling ----------
SKIP_SUB = re.compile(r'(gallery|demonstrations?|gameplay guide|moveset)', re.I)
def split_title(t):
    if '/' in t:
        base, sub = t.split('/', 1)
        if base in PAGES: return base, sub
    return t, None
MAIN_PAGES = [t for t in T['pages'] if split_title(t)[1] is None]
SUBS = collections.defaultdict(list)
for t in T['pages']:
    b, s = split_title(t)
    if s is not None and not SKIP_SUB.search(s): SUBS[b].append((s, t))
MAINSET = set(MAIN_PAGES)

def canon(target):
    """wiki link target -> (canonical main page title or None, anchor)"""
    target = norm(target); anchor = ''
    if '#' in target: target, anchor = target.split('#', 1); anchor = '#' + anchor
    if target in MAINSET: return target, anchor
    if target in REDIR:
        t2, a2 = REDIR[target]
        if t2 in MAINSET: return t2, a2 or anchor
        b, s = split_title(t2)
        if b in MAINSET and s: return b, '#' + s
    b, s = split_title(target)
    if b in MAINSET and s is not None and not SKIP_SUB.search(s): return b, '#' + s
    if b in MAINSET and s is not None: return b, anchor
    return None, ''

# ---------- balanced scanning helpers ----------
def find_balanced(text, i, o, c):
    depth = 0; n = len(text); j = i
    while j < n:
        if text.startswith(o, j): depth += 1; j += len(o)
        elif text.startswith(c, j):
            depth -= 1; j += len(c)
            if depth == 0: return j
        else: j += 1
    return -1

def split_args(body):
    args = []; cur = []; depth_t = depth_l = 0; i = 0
    while i < len(body):
        if body.startswith('{{', i): depth_t += 1; cur.append('{{'); i += 2
        elif body.startswith('}}', i): depth_t -= 1; cur.append('}}'); i += 2
        elif body.startswith('[[', i): depth_l += 1; cur.append('[['); i += 2
        elif body.startswith(']]', i): depth_l -= 1; cur.append(']]'); i += 2
        elif body[i] == '|' and depth_t == 0 and depth_l == 0: args.append(''.join(cur)); cur = []; i += 1
        else: cur.append(body[i]); i += 1
    args.append(''.join(cur)); return args

INFOBOX = {'character', 'ability', 'chapter infobox', 'chapter_infobox', 'episode', 'volume', 'location', 'group', 'story arc', 'object', 'event', 'anime', 'manga', 'novel', 'game', 'music', 'album', 'person', 'magazine', 'play', 'blu-ray&dvd', 'announcement', 'calendar', 'battles'}
INFO_SKIP = re.compile(r'^(image|images|image gallery|gallery|caption|imagewidth|cover|image1|image2|footer|title2|tabs?|width|height|theme|color|colour|allrelatives|allrelative|relatives? ?all|moveset|new character|previous|next)$', re.I)
infoboxes = {}

def clean_inline(s, intable=False, sep=' ', fmt=False):
    s = conv(s, intable, None, fmt)
    s = re.sub(r'\s*\n\s*', sep, s).strip()
    return s

def tmpl_handler(name, args, ctx):
    n = name.strip().lower()
    pos = [a for a in args if '=' not in a.split('{{')[0].split('[[')[0]]
    named = {}
    for a in args:
        head = a.split('{{')[0].split('[[')[0]
        if '=' in head:
            k, v = a.split('=', 1); named[k.strip().lower()] = v.strip()
    if n in INFOBOX:
        ctx.setdefault('info', (n, named, args)); return ''
    if n == 'nihongo':
        eng = clean_inline(pos[0]) if pos else ''; kanji = clean_inline(pos[1]) if len(pos) > 1 else ''; rom = clean_inline(pos[2]) if len(pos) > 2 else ''
        extra = ', '.join(x for x in (kanji, rom) if x)
        return f'{eng} ({extra})' if extra else eng
    if n in ('ruby',): return clean_inline(pos[0]) if pos else ''
    if n in ('small', 'smaller', 'nowrap', 'big', 'larger', 'noitalic', 'tooltip', 'abbr'): return clean_inline(pos[0]) if pos else ''
    if n in ('color', 'colour', 'font color'): return clean_inline(pos[-1]) if pos else ''
    if n in ('quotebox', 'quote'):
        q = clean_inline(named.get('quote', pos[0] if pos else '')); who = clean_inline(named.get('personquoted', named.get('source', '')))
        return f'\n> {q}\n> - {who}\n' if q else ''
    if n in ('main', 'see also', 'further', 'seealso', 'for', 'details'):
        links = [f'[[{p}]]' for p in pos if p.strip()]; return ('*See also: ' + ', '.join(links) + '*') if links else ''
    if n in ('transliteration', 'lang', 'translit'): return clean_inline(pos[-1]) if pos else ''
    return ''   # navboxes, tabs, stubs, spoiler banners, etc.

def conv_templates(text, ctx):
    out = []; i = 0
    while i < len(text):
        if text.startswith('{{', i):
            j = find_balanced(text, i, '{{', '}}')
            if j == -1: out.append(text[i:]); break
            body = text[i + 2:j - 2]; parts = split_args(body)
            out.append(tmpl_handler(parts[0], parts[1:], ctx)); i = j
        else: out.append(text[i]); i += 1
    return ''.join(out)

def remove_files(text):
    out = []; i = 0
    while i < len(text):
        m = re.match(r'\[\[\s*(File|Image|Video):', text[i:], re.I)
        if m:
            j = find_balanced(text, i, '[[', ']]')
            if j == -1: break
            i = j
        else: out.append(text[i]); i += 1
    return ''.join(out)

LINKRE = re.compile(r'\[\[([^\[\]]+?)\]\]')
def conv_links(text, intable=False):
    def rep(m):
        inner = m.group(1)
        if inner.lower().startswith('category:') or inner.lower().startswith(':category:'): return ''
        target, _, label = inner.partition('|'); label = label.strip() or target.strip()
        if re.match(r'^(wikipedia|w|wp):', target, re.I):
            t = re.sub(r'^(wikipedia|w|wp):', '', target, flags=re.I); return f'[{label}](https://en.wikipedia.org/wiki/{quote(t.replace(" ", "_"))})'
        if ':' in target and re.match(r'^(special|help|user|template|file|talk|forum|message wall|blog)', target, re.I): return label
        c, anc = canon(target)
        if not c: return label
        sep = '\\|' if intable else '|'
        if label == c and not anc: return f'[[{fname(c)}]]'
        return f'[[{fname(c)}{anc}{sep}{label}]]'
    return LINKRE.sub(rep, text)

BAD = re.compile(r'[\\/:*?"<>|#^\[\]]')
def fname(t): return BAD.sub('', t).strip()

def conv_tables(text):
    out = []; lines = text.split('\n'); i = 0
    while i < len(lines):
        if lines[i].lstrip().startswith('{|'):
            j = i; blk = []
            while j < len(lines) and not lines[j].lstrip().startswith('|}'): blk.append(lines[j]); j += 1
            rows = []; cur = None
            for ln in blk[1:]:
                s = ln.strip()
                if s.startswith('|-'): cur = []; rows.append(cur); continue
                if s.startswith('|+'): continue
                if s.startswith('!') or s.startswith('|'):
                    if cur is None: cur = []; rows.append(cur)
                    cells = re.split(r'\|\||!!', s[1:])
                    for c in cells:
                        c = c.split('|', 1)[1] if ('|' in c and not '[[' in c.split('|', 1)[0]) else c
                        cur.append(c.strip())
                elif cur: cur[-1] += ' ' + s
            rows = [r for r in rows if r]
            filled = sum(1 for r in rows for c in r if re.sub(r'[\s|]+', '', c)); total = sum(len(r) for r in rows) or 1
            if rows and max(len(r) for r in rows) <= 12 and filled / total > 0.4:
                w = max(len(r) for r in rows)
                for k, r in enumerate(rows):
                    r = r + [''] * (w - len(r)); out.append('| ' + ' | '.join(x.replace('|', '\\|').replace('\n', ' ') for x in r) + ' |')
                    if k == 0: out.append('|' + '---|' * w)
            i = j + 1
        else: out.append(lines[i]); i += 1
    return '\n'.join(out)

def fmt_inline(text):
    text = re.sub(r"'''''(.+?)'''''", r'***\1***', text); text = re.sub(r"'''(.+?)'''", r'**\1**', text); text = re.sub(r"''(.+?)''", r'*\1*', text)
    return text

def conv(text, intable=False, ctx=None, fmt=True):
    ctx = ctx if ctx is not None else {}
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    text = re.sub(r'<ref[^>/]*?/>', '', text); text = re.sub(r'<ref[^>]*>.*?</ref>', '', text, flags=re.S)
    text = re.sub(r'<gallery[^>]*>.*?</gallery>', '', text, flags=re.S)
    text = re.sub(r'<(nowiki|noinclude|includeonly|onlyinclude)[^>]*>', '', text); text = re.sub(r'</(nowiki|noinclude|includeonly|onlyinclude)>', '', text)
    text = remove_files(text)
    text = conv_templates(text, ctx)
    text = conv_links(text, intable)
    text = re.sub(r'\[(https?://[^\s\]]+)\s+([^\]]+)\]', r'[\2](\1)', text)
    text = re.sub(r'\[(https?://[^\s\]]+)\]', r'<\1>', text)
    if fmt: text = fmt_inline(text)
    text = re.sub(r'<br\s*/?>', '\n' if not intable else ' ', text, flags=re.I)
    text = re.sub(r'</?(small|big|span|div|center|sup|sub|u|s|font|p|abbr|blockquote|poem|includeonly)[^>]*>', '', text, flags=re.I)
    text = re.sub(r'<[^>\n]+>', '', text)
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&')
    return text

def drop_sections(md, names):
    lines = md.split('\n'); out = []; skip = None
    for ln in lines:
        m = re.match(r'^(#{2,6}) (.*)$', ln)
        if m:
            lvl = len(m.group(1))
            if skip is not None and lvl <= skip: skip = None
            if skip is None and m.group(2).strip().lower() in names: skip = lvl; continue
        if skip is None: out.append(ln)
    return '\n'.join(out)

def remove_empty_sections(md):
    lines = md.split('\n'); keep = []; i = 0
    while i < len(lines):
        m = re.match(r'^(#{2,6}) ', lines[i])
        if m:
            lvl = len(m.group(1)); j = i + 1
            while j < len(lines) and not lines[j].strip(): j += 1
            if j >= len(lines) or (re.match(r'^(#{1,6}) ', lines[j]) and len(re.match(r'^(#+)', lines[j]).group(1)) <= lvl):
                i = j; continue
        keep.append(lines[i]); i += 1
    return '\n'.join(keep)

def body_to_md(wt):
    ctx = {}
    wt = re.sub(r'<!--.*?-->', '', wt, flags=re.S)
    wt = conv_tables(wt) if '{|' in wt else wt
    md = conv(wt, False, ctx, fmt=False)
    out = []
    for ln in md.split('\n'):
        m = re.match(r'^(={2,6})\s*(.*?)\s*\1\s*$', ln)
        if m: out.append('#' * min(6, len(m.group(1))) + ' ' + re.sub(r"'{2,}", '', m.group(2))); continue
        m = re.match(r'^([*#:;]+)\s*(.*)$', ln)
        if m:
            marks, rest = m.groups(); depth = len(marks) - 1
            if marks[-1] == ':' and marks[0] == ':': out.append(rest); continue
            if marks[-1] == ';': out.append('**' + rest + '**'); continue
            out.append('  ' * depth + ('1. ' if marks[-1] == '#' else '- ') + rest); continue
        out.append(ln)
    md = fmt_inline('\n'.join(out))
    md = drop_sections(md, ('navigation', 'references', 'gallery', 'external links', 'image gallery', 'sources'))
    md = remove_empty_sections(md)
    md = re.sub(r'[ \t]+\n', '\n', md); md = re.sub(r'\n{3,}', '\n\n', md).strip()
    return md, ctx

def infobox_md(info):
    if not info: return '', {}
    n, named, args = info
    rows = []; flat = {}
    for k, v in named.items():
        if INFO_SKIP.match(k.replace('_', ' ')): continue
        val = fmt_inline(clean_inline(v, sep='; '))
        val = re.sub(r'(;\s*)+', '; ', val).strip(' ;')
        if not val or val in ('?', '-', 'N/A', 'None', 'Unknown'): continue
        label = k.replace('_', ' ').title().replace('(S)', '(s)').replace(' Va', ' VA').replace('Rōmaji', 'Rōmaji')
        rows.append(f'- **{label}:** {val}'); flat[k] = val
    return '\n'.join(rows), flat

def first_sentence(md):
    for para in md.split('\n\n'):
        p = para.strip()
        if not p or p.startswith(('#', '>', '|', '-', '*See')): continue
        p = re.sub(r'\[\[([^\]|#]+)(?:#[^\]|]*)?\|([^\]]+)\]\]', r'\2', p); p = re.sub(r'\[\[([^\]]+)\]\]', r'\1', p); p = re.sub(r'[*_`]', '', p)
        m = re.search(r'(.+?[.!?])(\s|$)', p)
        s = (m.group(1) if m else p).strip()
        return s[:220]
    return ''

# ---------- classification ----------
OVERRIDE = {'Final Selection': ('events', ''), 'Hashira Training': ('events', ''), 'Rehabilitation Training': ('events', ''), 'Kasugai Crow': ('concepts', ''), 'Wisteria': ('concepts', ''), 'Blue Spider Lily': ('concepts', ''),
  'Demon Slayer Mark': ('concepts', ''), 'Extrasensory Perception': ('concepts', ''), 'Flesh Manipulation': ('concepts', ''), 'Regeneration': ('concepts', ''), 'Repetitive Action': ('concepts', ''), 'Selfless State': ('concepts', ''),
  'Opening Thread': ('sources', 'Media'), 'Flame Hashira Chronicles': ('sources', 'Media'), 'Bright Red Nichirin Sword': ('weapons', ''), 'Storyline': ('events', ''), 'Chapters and Volumes': ('sources', ''), 'Kimetsu Academy': ('sources', 'Media'), 'Light Novel': ('sources', 'Media'), 'Movie': ('sources', 'Media')}
def classify(title, info, cats):
    if title in OVERRIDE: return OVERRIDE[title]
    cl = set(c.lower() for c in cats)
    n = info[0] if info else ''
    if n in ('chapter infobox', 'chapter_infobox'): return 'sources', 'Chapters'
    if n == 'episode': return 'sources', 'Episodes'
    if n == 'volume': return 'sources', 'Volumes'
    if n in ('anime', 'manga', 'novel', 'game', 'music', 'album', 'magazine', 'play', 'blu-ray&dvd', 'announcement', 'calendar') or cl & {'bd&dvd', 'games', 'anime', 'art books', 'fanbooks', 'character books', 'illustration books', 'ending themes', 'hinokami chronicles series', 'anime spin-offs'}: return 'sources', 'Media'
    if n == 'ability' or cl & {'abilities', 'breathing styles'}: return 'techniques', ''
    if n == 'location' or cl & {'districts', 'brothels'}: return 'locations', ''
    if n == 'group' or cl & {'groups', 'demon slayer corps', 'antagonist groups', 'families', 'kakushi'} and n != 'character': return 'factions', ''
    if n == 'object': return 'weapons', ''
    if n == 'story arc' or re.search(r'(^| )arc$', title.lower()) and not info: return 'events', ''
    if n in ('event', 'battles') or cl & {'events', 'battles'}: return 'events', ''
    if n == 'character' or n == 'person' or cl & {'characters'}:
        return ('demons' if 'demon' in cl or 'twelve kizuki' in cl else 'characters'), ''
    return 'concepts', ''

# ---------- build ----------
os.makedirs(OUT, exist_ok=True)
notes = {}   # title -> dict
aliases = collections.defaultdict(set)
for r, (t, a) in REDIR.items():
    if t in MAINSET and r != t: aliases[t].add(r)
    else:
        b, s = split_title(t)
        if b in MAINSET and s: pass

for title in MAIN_PAGES:
    wt = CONTENT.get(title, '')
    md, ctx = body_to_md(wt)
    ibtxt, flat = infobox_md(ctx.get('info'))
    cat, sub = classify(title, ctx.get('info'), CATS.get(title, []))
    # subpages appended as sections
    extra = []
    for s, full in sorted(SUBS.get(title, []), key=lambda x: (0 if x[0] == 'Synopsis' else 1 if x[0] == 'Relationships' else 2, x[0])):
        smd, sctx = body_to_md(CONTENT.get(full, ''))
        smd = re.sub(r'^#{2,3} ' + re.escape(s) + r'\s*\n+', '', smd)
        if smd: extra.append(f'## {s}\n\n' + re.sub(r'^(#{2,5})', lambda m: '#' + m.group(1), smd, flags=re.M))
    notes[title] = dict(title=title, cat=cat, sub=sub, md=md, info=ibtxt, flat=flat, extra='\n\n'.join(extra), cats=CATS.get(title, []))

# related = most-linked pages inside text
def link_targets(md):
    return [m.group(1) for m in re.finditer(r'\[\[([^\]|#]+)', md)]

q = lambda s: '"' + str(s).replace('\\', '\\\\').replace('"', '\\"') + '"'
def flist(a): return '[' + ', '.join(q(x) if re.search(r'[:#\[\]\'",]', x) else x for x in a) + ']'

count = 0; per = collections.Counter()
for title, N in notes.items():
    c = CAT[N['cat']]; hub = f"{c['name']} Hub"
    body = N['md']
    summ = first_sentence(body) or first_sentence(N['extra'])
    tgt = collections.Counter(t for t in link_targets(body + '\n' + N['extra']) if t != fname(title))
    rel = [t for t, _ in tgt.most_common(8)]
    al = sorted(a for a in aliases.get(title, []) if fname(a) != fname(title) and len(a) > 1)
    for k in ('rōmaji', 'romaji'):
        v = N['flat'].get(k)
        if v and len(v) < 60 and not v.startswith('['): al.append(re.sub(r'[*_]', '', v))
    if fname(title) != title: al.insert(0, title)
    al = list(dict.fromkeys(al))[:12]
    tags = [c['tag']] + [re.sub(r'[^a-z0-9]+', '-', x.lower()).strip('-') for x in N['cats'] if x.lower() not in ('characters', 'image galleries', 'deceased', 'alive')][:5]
    tags = list(dict.fromkeys(t for t in tags if t))
    url = 'https://kimetsu-no-yaiba.fandom.com/wiki/' + quote(title.replace(' ', '_'))
    fm = ['---', f'category: {c["id"]}', f'tags: {flist(tags)}', f'cssclasses: [cat-{c["id"]}]', f'aliases: {flist(al)}', f'summary: {q(summ)}', f'up: {q("[[" + hub + "]]")}',
          f'related: [{", ".join(q("[[" + r + "]]") for r in rel)}]', f'source: {q(url)}', f'created: {TODAY}', '---']
    parts = [f'# {title}', '', f'> [!{c["id"]}] At a glance', f'> {summ or title}', '']
    if N['info']: parts += ['## Profile', '', N['info'], '']
    if body: parts += [body, '']
    if N['extra']: parts += [N['extra'], '']
    parts += ['## Connections', '', f'- **Hub:** [[{hub}]] · [[Home]] · [[A-Z Index]]']
    if rel: parts.append('- **Related:** ' + ' · '.join(f'[[{r}]]' for r in rel))
    parts += ['', '## Source', '', f'Content from the [Kimetsu no Yaiba Wiki]({url}) on Fandom, licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). See [[Wiki Attribution]].']
    doc = '\n'.join(fm) + '\n\n' + '\n'.join(parts) + '\n'
    folder = os.path.join(OUT, c['folder'], N['sub']) if N['sub'] else os.path.join(OUT, c['folder'])
    os.makedirs(folder, exist_ok=True)
    open(os.path.join(folder, fname(title) + '.md'), 'w').write(doc)
    count += 1; per[N['cat'] + ('/' + N['sub'] if N['sub'] else '')] += 1
print('notes', count); print(dict(per))
json.dump({t: n['cat'] for t, n in notes.items()}, open('classified.json', 'w'))
