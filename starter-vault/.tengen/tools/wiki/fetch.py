import json, urllib.request, urllib.parse, time
UA="VaultBuilder/1.0 (personal Obsidian vault; polite, low rate)"
A="https://kimetsu-no-yaiba.fandom.com/api.php"
def api(**p):
    p['format']='json'; url=A+'?'+urllib.parse.urlencode(p)
    for t in range(5):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=60))
        except Exception as e: time.sleep(2*(t+1))
    raise RuntimeError(url)
T=json.load(open('titles.json')); pages=T['pages']; reds=T['redirects']
content={}; cats={}
def batches(lst,n=50):
    for i in range(0,len(lst),n): yield lst[i:i+n]
for b in batches(pages+reds):
    d=api(action='query',prop='revisions',rvprop='content',rvslots='main',titles='|'.join(b))
    for pg in d['query']['pages'].values():
        if 'revisions' in pg: content[pg['title']]=pg['revisions'][0]['slots']['main']['*']
    time.sleep(0.5)
print('content',len(content))
for b in batches(pages):
    cont={}
    while True:
        d=api(action='query',prop='categories',cllimit='max',titles='|'.join(b),**cont)
        for pg in d['query']['pages'].values():
            cats.setdefault(pg['title'],[]).extend(c['title'].replace('Category:','') for c in pg.get('categories',[]))
        if 'continue' in d: cont=d['continue']
        else: break
    time.sleep(0.4)
print('cats',len(cats))
json.dump({'content':content,'cats':cats},open('raw.json','w'))
