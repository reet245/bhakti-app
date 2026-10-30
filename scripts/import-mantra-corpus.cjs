/*
 * Rebuild the bundled Sanskrit Wikisource / Nitya corpus from pinned snapshots.
 * node scripts/import-mantra-corpus.cjs             (offline / deterministic)
 * node scripts/import-mantra-corpus.cjs --refresh   (fetch missing sources)
 * Add --update-existing to explicitly update already pinned sources.
 * Text: CC BY-SA 4.0 or public domain per entry; see docs/MANTRA_SOURCES.md.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'src/data/mantra-corpus');
const manifest = require('../src/data/mantra-corpus/manifest.json');
const summaries = { ...require('../src/data/mantra-corpus/summaries.json'), ...require('../src/data/mantra-corpus/summaries-additional.json') };
const nityaManifest = require('../src/data/mantra-corpus/nitya-manifest.json');
const chapterNames = ['अर्जुनविषादयोगः', 'साङ्ख्ययोगः', 'कर्मयोगः', 'ज्ञानकर्मसंन्यासयोगः', 'कर्मसंन्यासयोगः', 'आत्मसंयमयोगः', 'ज्ञानविज्ञानयोगः', 'अक्षरब्रह्मयोगः', 'राजविद्याराजगुह्ययोगः', 'विभूतियोगः', 'विश्वरूपदर्शनयोगः', 'भक्तियोगः', 'क्षेत्रक्षेत्रज्ञविभागयोगः', 'गुणत्रयविभागयोगः', 'पुरुषोत्तमयोगः', 'दैवासुरसम्पद्विभागयोगः', 'श्रद्धात्रयविभागयोगः', 'मोक्षसंन्यासयोगः'];
const chapterCounts = [47,72,43,42,29,47,30,28,34,42,55,20,34,27,20,24,28,78];
const snapshotFile = path.join(folder, 'sources.json');
const license = 'CC BY-SA 4.0';
const licenseUrl = 'https://creativecommons.org/licenses/by-sa/4.0/';

function stripTemplates(input) {
  let text = input;
  for (let i = 0; i < 15 && /\{\{[^{}]*\}\}/.test(text); i++) text = text.replace(/\{\{[^{}]*\}\}/g, '');
  return text;
}
function clean(input) {
  return stripTemplates(input)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref\b[^>]*\/>/gi, '')
    .replace(/\[\[(?:वर्गः|Category|File|Image|चित्र|सञ्चिका):[^\]]*\]\]/gi, '')
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
    .replace(/\[https?:\/\/[^\s\]]+(?:\s+([^\]]+))?\]/g, '$1')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/'{2,}/g, '')
    .replace(/^\s*=+\s*(.*?)\s*=+\s*$/gm, '$1')
    .replace(/^[ \t]*[:;]+/gm, '')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&')
    .replace(/[\u200b-\u200f\ufeff]/g, '')
    .replace(/\n(?:संबंधित कड़ियाँ|सम्बद्धानुबन्धाः|बाहरी कडियाँ)[\s\S]*$/g, '')
    .replace(/\n----[\s\S]*$/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/^रचयिता-.*$/gm, '')
    .replace(/^—$/gm, '')
    .replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
function poemText(raw) {
  const poems = [...raw.matchAll(/<poem\b[^>]*>([\s\S]*?)<\/poem>/gi)].map(m => m[1]);
  return clean(poems.length ? poems.join('\n\n') : raw);
}
function asciiDigits(text) { return text.replace(/[०-९]/g, char => String(char.charCodeAt(0) - 0x966)); }
function bengali(text) {
  return [...text].map(c => {
    if (c === 'ॐ') return 'ওঁ';
    if (c === 'व') return 'ব';
    if (c === 'ऱ') return 'র';
    if (c === 'ळ') return 'ল';
    if (c === 'ऽ') return 'ঽ';
    if ('।॥'.includes(c)) return c;
    const n = c.codePointAt(0);
    return (n >= 0x901 && n <= 0x94d) || (n >= 0x960 && n <= 0x963) || (n >= 0x966 && n <= 0x96f) ? String.fromCodePoint(n + 0x80) : c;
  }).join('');
}
function roman(text) {
  const vowels = {अ:'a',आ:'ā',इ:'i',ई:'ī',उ:'u',ऊ:'ū',ऋ:'ṛ',ॠ:'ṝ',ऌ:'ḷ',ॡ:'ḹ',ए:'e',ऐ:'ai',ओ:'o',औ:'au'};
  const marks = {'ा':'ā','ि':'i','ी':'ī','ु':'u','ू':'ū','ृ':'ṛ','ॄ':'ṝ','ॢ':'ḷ','ॣ':'ḹ','े':'e','ै':'ai','ो':'o','ौ':'au','्':''};
  const cons = {क:'k',ख:'kh',ग:'g',घ:'gh',ङ:'ṅ',च:'c',छ:'ch',ज:'j',झ:'jh',ञ:'ñ',ट:'ṭ',ठ:'ṭh',ड:'ḍ',ढ:'ḍh',ण:'ṇ',त:'t',थ:'th',द:'d',ध:'dh',न:'n',प:'p',फ:'ph',ब:'b',भ:'bh',म:'m',य:'y',र:'r',ल:'l',व:'v',श:'ś',ष:'ṣ',स:'s',ह:'h',ळ:'ḷ'};
  const other = {'ं':'ṃ','ः':'ḥ','ँ':'m̐','ऽ':'’','ॐ':'oṃ','।':'।','॥':'॥'};
  let out = ''; const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (cons[c]) { out += cons[c]; if (Object.hasOwn(marks, chars[i + 1])) out += marks[chars[++i]]; else out += 'a'; }
    else out += vowels[c] ?? marks[c] ?? other[c] ?? asciiDigits(c);
  }
  return out;
}
function provenance(source, reference) {
  const url = `https://sa.wikisource.org/w/index.php?title=${encodeURIComponent(source.title)}&oldid=${source.revision}`;
  return { textSource: url, sourceUrl: url, sourceLabel: 'Sanskrit Wikisource', sourceRevision: source.revision, reference: reference || source.title, license, licenseUrl,
    attribution: `${source.title} — Sanskrit Wikisource contributors; ${license}. Formatting normalized; Bengali script and Roman transliteration generated mechanically.`,
    transliterationNote: 'Mechanical IAST transliteration; not an audio pronunciation guide.', textBnNote: 'Sanskrit rendered mechanically in Bengali script; not a Bengali translation.' };
}
async function fetchSources(titles) {
  const url = new URL('https://sa.wikisource.org/w/api.php');
  for (const [key, value] of Object.entries({ action:'query', format:'json', formatversion:'2', prop:'revisions', rvprop:'ids|content', rvslots:'main', titles:titles.join('|'), redirects:'1' })) url.searchParams.set(key,value);
  let response;
  for (let attempt=0; attempt<5; attempt++) {
    response = await fetch(url, { headers: { 'User-Agent':'BhaktiCorpusImporter/1.0 (offline devotional reading corpus; source attribution retained)' } });
    if (response.status !== 429 && response.status !== 503) break;
    await new Promise(resolve=>setTimeout(resolve, (attempt+1)*5000));
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return titles.map(title => {
    let resolved = data.query.normalized?.find(x=>x.from === title)?.to || title;
    resolved = data.query.redirects?.find(x=>x.from === resolved)?.to || resolved;
    const page = data.query?.pages?.find(x=>x.title === resolved);
    if (!page?.revisions) throw new Error(`Missing source: ${title}`);
    const revision = page.revisions[0]; const raw = revision.slots.main.content;
    // Gita pages include extensive commentaries. Snapshot only the root-text poem blocks.
    const wikitext = title.startsWith('भगवद्गीता/') ? [...raw.matchAll(/<poem\b[^>]*>[\s\S]*?<\/poem>/gi)].map(m=>m[0]).join('\n\n') : raw;
    return { requestedTitle:title, title:page.title, revision:revision.revid, sha256:crypto.createHash('sha256').update(raw).digest('hex'), wikitext };
  });
}
function createEntry(item, source) {
  let text = poemText(source.wikitext);
  if (item.start) { const index = text.indexOf(item.start); if (index < 0) throw new Error(`Missing start: ${item.id}`); text = text.slice(index); }
  if (item.end) { const index = text.indexOf(item.end); if (index < 0) throw new Error(`Missing end: ${item.id}`); text = text.slice(0, index + item.end.length); }
  if (item.text) { if (!clean(source.wikitext).includes(item.text)) throw new Error(`Unmatched excerpt: ${item.id}`); text = item.text; }
  for (const correction of item.corrections || []) {
    if (!text.includes(correction.from)) throw new Error(`Missing correction target: ${item.id}`);
    text = text.split(correction.from).join(correction.to);
  }
  if (/[A-Za-z]/.test(text)) throw new Error(`Latin-letter contamination in Sanskrit: ${item.id}`);
  if (text.length < 9 || /\{\{|\}\}|\[\[|\]\]/.test(text)) throw new Error(`Invalid extraction: ${item.id}`);
  const summary = summaries[item.id];
  return { id:item.id, title:item.title, titleHi:item.titleHi || item.page, titleBn:item.titleBn || bengali(item.titleHi || item.page), deityId:item.deityId, categoryId:item.categoryId || 'stotra', language:'Sanskrit', text, textBn:bengali(text), transliteration:roman(text),
    ...(summary ? { meaning:summary[0], meaningHi:summary[1], meaningBn:summary[2], meaningType:'Original thematic summary; not a line-by-line translation.' } : {}),
    isExcerpt: false, ...(item.start || item.end || item.text ? {excerptOf:source.title} : {}), ...(item.corrections ? {editorialChanges:item.corrections.map(x=>x.note)} : {}), ...provenance(source) };
}
async function main() {
  fs.mkdirSync(folder, {recursive:true});
  let sources = fs.existsSync(snapshotFile) ? JSON.parse(fs.readFileSync(snapshotFile,'utf8')) : [];
  if (process.argv.includes('--refresh')) {
    const titles = [...new Set([...manifest.map(x=>x.page), ...chapterNames.map(x=>`भगवद्गीता/${x}`)])];
    const pending = titles.filter(title=>!sources.some(x=>x.requestedTitle === title) || process.argv.includes('--update-existing'));
    for (let offset=0; offset<pending.length; offset+=10) {
      const batch = pending.slice(offset,offset+10);
      const received = await fetchSources(batch);
      sources = sources.filter(x=>!batch.includes(x.requestedTitle)).concat(received);
      fs.writeFileSync(snapshotFile,JSON.stringify(sources,null,2)+'\n');
      console.log(`Fetched ${batch.join(', ')}`);
      await new Promise(resolve=>setTimeout(resolve,2500));
    }
  }
  const findSource = title => { const value = sources.find(x=>x.requestedTitle === title); if (!value) throw new Error(`No snapshot for ${title}. Run --refresh.`); return value; };
  const nityaSnapshot = path.join(folder, 'nitya-sources.json');
  let nityaSources = fs.existsSync(nityaSnapshot) ? JSON.parse(fs.readFileSync(nityaSnapshot,'utf8')) : [];
  if (process.argv.includes('--refresh')) {
    for (const item of nityaManifest) {
      if (nityaSources.some(x=>x.id===item.id) && !process.argv.includes('--update-existing')) continue;
      const url = `https://getnitya.com/data/${item.path}/dev.json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Nitya ${item.id}: HTTP ${response.status}`);
      const raw = await response.text(); const data=JSON.parse(raw);
      if (!data.v) throw new Error(`Invalid Nitya data: ${item.id}`);
      const snapshot = { id:item.id,url,sha256:crypto.createHash('sha256').update(raw).digest('hex'),data };
      nityaSources = nityaSources.filter(x=>x.id!==item.id).concat(snapshot);
      fs.writeFileSync(nityaSnapshot,JSON.stringify(nityaSources,null,2)+'\n');
      console.log(`Fetched Nitya ${item.id}`);
    }
  }
  const entries = manifest.filter(item=>!nityaManifest.some(n=>n.id===item.id)).map(item=>createEntry(item,findSource(item.page)));
  for (const item of nityaManifest) {
    const source=nityaSources.find(x=>x.id===item.id);
    if (!source) throw new Error(`No Nitya snapshot: ${item.id}. Run --refresh.`);
    const sections = Object.entries(source.data.v);
    if (item.expectedSections && sections.length!==item.expectedSections) throw new Error(`Nitya ${item.id}: unexpected section count ${sections.length}`);
    const text = sections.map(([,verse])=>verse.l.join('\n')).join('\n\n');
    const summary=summaries[item.id];
    entries.push({id:item.id,title:item.title,titleHi:item.titleHi,titleBn:bengali(item.titleHi),deityId:item.deityId,categoryId:item.categoryId,language:item.language,text,textBn:bengali(text),transliteration:roman(text),isExcerpt:false,
      meaning:item.meaning||summary?.[0],meaningHi:item.meaningHi||summary?.[1],meaningBn:item.meaningBn||summary?.[2],meaningType:'Original thematic summary; not a line-by-line translation.',
      textSource:source.url,sourceUrl:`https://getnitya.com/en/${item.path}/`,sourceLabel:'Nitya',sourceRevision:source.sha256,reference:item.title,license:'Public domain (PDM 1.0)',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',
      attribution:`Traditional ${item.language} text; source: Nitya (getnitya.com). Text-only JSON marked public domain by source. Bengali and Roman script generated mechanically. Original summaries by Bhakti App.`,
      sourcePolicyUrl:'https://getnitya.com/en/about/data/',transliterationNote:'Mechanical transliteration; retains written vowels, not an audio pronunciation guide.',textBnNote:`${item.language} rendered mechanically in Bengali script; not a Bengali translation.`,sectionCount:sections.length});
  }
  const devotionalCount=entries.length;
  const gitaSummaryFile = path.join(folder, 'gita-summaries.json');
  const gitaSummaries = fs.existsSync(gitaSummaryFile) ? JSON.parse(fs.readFileSync(gitaSummaryFile,'utf8')) : {};
  for (let i = 0; i < chapterNames.length; i++) {
    const source = findSource(`भगवद्गीता/${chapterNames[i]}`);
    const text = poemText(source.wikitext);
    const pattern = /([\s\S]*?)॥\s*([०-९0-9]+)\s*[-–.]\s*([०-९0-9]+)\s*॥/g;
    const verses = [...text.matchAll(pattern)].map(match=>({text:match[1],chapter:Number(asciiDigits(match[2])),verse:Number(asciiDigits(match[3]))}));
    if (verses.length !== chapterCounts[i]) throw new Error(`Chapter ${i+1}: expected ${chapterCounts[i]}, found ${verses.length}`);
    for (let v = 0; v < verses.length; v++) {
      const verse = verses[v];
      if (verse.chapter !== i+1 || verse.verse !== v+1) throw new Error(`Verse order ${i+1}:${v+1}`);
      let lines = verse.text.split('\n').map(x=>x.trim()).filter(Boolean);
      // Exclude speaker labels, invocations and chapter colophons; retain the verse itself.
      lines = lines.filter(x => !/^(?:(?:श्री)?भगवानु|(?:अर्जुन|सञ्जय|संजय|धृतराष्ट्र)\s*उ)वाच/.test(x) && !/अध्याय|ऽध्याय|श्रीपरमात्मने|अथ श्रीमद्|^ॐ$|^इति श्रीमद्भगवद्गीता/.test(x));
      // "इति" also begins genuine verse halves (4.14, 10.8, 13.18, 15.20, 18.63).
      // Every verse in this pinned edition has at least two nonempty poetic lines.
      if (lines.length < 2) throw new Error(`Incomplete Gita verse lines: ${i+1}.${v+1}`);
      const content = `${lines.join('\n').trim()} ॥${i+1}.${v+1}॥`;
      if (content.length < 25 || content.length > 850) throw new Error(`Unexpected Gita verse length: ${i+1}.${v+1}`);
      entries.push({id:`gita-${i+1}-${v+1}`,title:`Bhagavad Gita ${i+1}.${v+1}`,titleHi:`भगवद्गीता ${i+1}.${v+1}`,titleBn:`ভগবদ্গীতা ${i+1}.${v+1}`,deityId:'krishna',categoryId:'shlokas',language:'Sanskrit',collectionId:'bhagavad-gita',chapter:i+1,verse:v+1,chapterTitle:chapterNames[i],text:content,textBn:bengali(content),transliteration:roman(content),isExcerpt:false,excerptOf:'Bhagavad Gita',...gitaSummaries[`${i+1}.${v+1}`],...provenance(source,`Bhagavad Gita ${i+1}.${v+1}`)});
    }
  }
  if (new Set(entries.map(e=>e.id)).size !== entries.length) throw new Error('Duplicate IDs');
  fs.writeFileSync(path.join(folder,'library.json'),JSON.stringify(entries,null,2)+'\n');
  fs.writeFileSync(path.join(folder,'stats.json'),JSON.stringify({source:'Sanskrit Wikisource and Nitya',license:'CC BY-SA 4.0 / public domain (per entry)',devotionalTexts:devotionalCount,gitaShlokas:entries.length-devotionalCount,total:entries.length,chapters:chapterCounts.length},null,2)+'\n');
  console.log(`Bundled ${devotionalCount} devotional texts and ${entries.length-devotionalCount} Gita shlokas.`);
}
main().catch(error=>{ console.error(error.message); process.exitCode = 1; });
