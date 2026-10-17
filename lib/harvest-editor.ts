import type { ExamItem } from "./formatter-rules";
import { CROP_VERSION } from "./figure-text-cleanup";

/** Apply new media to the live snapshot, preserving user-edited text and formatting on resumed drafts. */
export function mergeHarvestedEditor(editor: HTMLElement, before: ExamItem[], after: ExamItem[]): string {
  const clone=editor.cloneNode(true) as HTMLElement;
  for(const item of after) {
    const node=clone.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`);
    if(!node) continue;
    const previous=before.find(old=>old.id===item.id);
    const stem=node.querySelector<HTMLElement>('[data-question-text]');
    // Stems render line breaks as <br>, so compare and diff without them (T-121: table rows stay one per line).
    const flat=(text:string)=>text.replace(/\n/g,'');
    if(stem && previous && stem.textContent===flat(previous.questionText) && flat(previous.questionText)!==flat(item.questionText) && removeWholeLines(stem,previous.questionText,item.questionText)) {
      // Table rows were removed line by line.
    } else if(stem && previous && stem.textContent===flat(previous.questionText) && flat(previous.questionText)!==flat(item.questionText)) {
      const old=flat(previous.questionText),next=flat(item.questionText);
      let start=0,end=0;
      while(start<old.length&&start<next.length&&old[start]===next[start])start++;
      while(end<old.length-start&&end<next.length-start&&old[old.length-1-end]===next[next.length-1-end])end++;
      const replacement=next.slice(start,next.length-end);
      // Geometry cleanup only deletes a table span; never replace a manually changed narrative.
      if(!replacement.trim()) {
        const walker=document.createTreeWalker(stem,NodeFilter.SHOW_TEXT),texts:Text[]=[];
        let text:Node|null;while((text=walker.nextNode())) texts.push(text as Text);
        let offset=0;
        for(const text of texts) {
          const length=text.length,from=Math.max(0,start-offset),to=Math.min(length,old.length-end-offset);
          if(to>from) text.deleteData(from,to-from);
          offset+=length;
        }
        // Rows removed with their text leave line breaks behind: drop empty text and repeated/edge <br>.
        for(const child of Array.from(stem.childNodes)) if(child.nodeType===Node.TEXT_NODE&&!child.textContent?.trim()) child.remove();
        for(const br of Array.from(stem.querySelectorAll('br'))) {
          const before=br.previousSibling,after=br.nextSibling;
          if(!before||!after||(before as Element).tagName==='BR') br.remove();
        }
      }
    }
    const setFigure=(host:HTMLElement,selector:string,attribute:string,label:string,url?:string,bbox?:number[],status?:string)=>{
      if(!url) return;
      let figure=host.querySelector<HTMLElement>(selector);
      if(!figure) {
        figure=document.createElement('div');figure.setAttribute(attribute,'true');figure.className='pl-4 space-y-2';
        const heading=document.createElement('p');heading.textContent=label;heading.style.color='#F2604D';heading.style.fontWeight='bold';
        const image=document.createElement('img');image.alt=label;image.style.maxWidth='100%';image.style.height='auto';
        figure.append(heading,image);
        host.append(figure);
      }
      const image=figure.querySelector<HTMLImageElement>('img');if(!image)return;
      image.src=url;image.dataset.sourcePage=String(item.sourcePage||'');
      if(bbox) image.dataset.sourceBbox=JSON.stringify(bbox);
      image.dataset.cropVersion=CROP_VERSION;
      if(status==='UNVERIFIED') {
        const badge=figure.querySelector('strong');if(badge) badge.textContent='รอตรวจเทียบต้นฉบับ';
      }
    };
    // T-130: harvest dropped a choice-table figure that an earlier harvest had attached.
    if(!item.imageUrl&&previous?.imageUrl) node.querySelector(':scope > [data-question-image]')?.remove();
    setQuestionFigures(node,item);
    const shared=node.querySelector<HTMLElement>('[data-shared-context-block]');
    if(shared) setFigure(shared,'[data-shared-image]','data-shared-image','รูปโจทย์ร่วม:',item.sharedContextImageUrl,item.sharedContextImageBbox);
    setFigure(node,'[data-explanation-image]','data-explanation-image','รูปคำอธิบาย:',item.explanationImageUrl,item.explanationImageBbox);
    for(const choice of item.choices) {
      let row=Array.from(node.querySelectorAll<HTMLElement>('[data-choice-key]')).find(row=>row.dataset.choiceKey===choice.key);
      // T-121 (audit, source1 Q16): image-only choices exist only after harvest; give them a row instead of dropping the image.
      if(!row&&choice.imageUrl) row=createChoiceRow(clone,node,choice.key)||undefined;
      if(row) setFigure(row,'[data-choice-image]','data-choice-image','',choice.imageUrl,choice.sourceBbox);
    }
    if(item.imageUrl||item.sharedContextImageUrl) node.querySelector('[data-missing-figure]')?.remove();
  }
  orderItemSections(clone);
  return clone.innerHTML;
}

/**
 * T-131: a question can print several figures (set 2 Q25 รูปที่ 1-4). Keep one "รูปโจทย์:" block with one
 * wrapper per figure in item order, so the export writes one image paragraph each under one label. Harvested
 * images are replaced in place; figures the user captured by hand (crop version "manual") are kept after them.
 */
function setQuestionFigures(node: HTMLElement, item: ExamItem) {
  // Same fallback as questionFigures (formatter-rules); this module stays free of runtime imports for its DOM test.
  const figures=item.questionImages?.length ? item.questionImages : item.imageUrl ? [{url:item.imageUrl,bbox:item.imageBbox}] : [];
  if(!figures.length) return;
  let block=node.querySelector<HTMLElement>(':scope > [data-question-image]')||node.querySelector<HTMLElement>('[data-question-image]');
  if(!block) {
    block=document.createElement('div');block.setAttribute('data-question-image','true');block.className='pl-4 space-y-2';
    const heading=document.createElement('p');heading.textContent='รูปโจทย์:';heading.style.color='#F2604D';heading.style.fontWeight='bold';
    block.append(heading);
    node.append(block);
  }
  const images=Array.from(block.querySelectorAll<HTMLImageElement>('img')).filter(image=>image.dataset.cropVersion!=='manual');
  // Older blocks hold a bare <img>; give every figure its own block wrapper so each exports as its own paragraph.
  const wrapperOf=(image:HTMLImageElement)=>{
    if(image.parentElement&&image.parentElement!==block&&image.parentElement.querySelectorAll('img').length===1) return image.parentElement;
    const wrapper=document.createElement('div');wrapper.setAttribute('data-question-figure','true');
    image.replaceWith(wrapper);wrapper.append(image);return wrapper;
  };
  const wrappers=images.map(wrapperOf);
  figures.forEach((figure,index)=>{
    let image=images[index];
    if(!image) {
      const template=wrappers[wrappers.length-1];
      const wrapper=template ? template.cloneNode(true) as HTMLElement : document.createElement('div');
      if(!template) wrapper.setAttribute('data-question-figure','true');
      wrapper.querySelectorAll('img').forEach(old=>old.remove());
      image=document.createElement('img');image.alt='รูปโจทย์:';image.style.maxWidth='100%';image.style.height='auto';
      wrapper.prepend(image);
      (wrappers[wrappers.length-1]||block!.lastElementChild)?.after(wrapper);
      if(!wrapper.isConnected) block!.append(wrapper);
      wrappers.push(wrapper);images.push(image);
    }
    image.src=figure.url;image.removeAttribute('srcset');image.dataset.sourcePage=String(item.sourcePage||'');
    if(figure.bbox) image.dataset.sourceBbox=JSON.stringify(figure.bbox); else delete image.dataset.sourceBbox;
    image.dataset.cropVersion=CROP_VERSION;
    if(item.imageStatus==='UNVERIFIED') { const badge=wrappers[index].querySelector('strong');if(badge) badge.textContent='รอตรวจเทียบต้นฉบับ'; }
  });
  // A re-harvest that found fewer figures drops the leftover harvested ones.
  wrappers.slice(figures.length).forEach(wrapper=>wrapper.remove());
}

/**
 * T-121 (owner screenshot 2026-10-17): master-template order is stem -> รูปโจทย์ -> ตัวเลือก -> คำอธิบาย.
 * Resumed harvests appended the question figure after the choices (the choice rows sit one wrapper deeper
 * than the old check expected). Move question figures and the missing-figure placeholder back in front of
 * the choices section. Idempotent; returns the number of moved nodes.
 */
export function orderItemSections(root: ParentNode): number {
  let moved=0;
  root.querySelectorAll<HTMLElement>('[data-item-id]').forEach(item=>{
    let section=item.querySelector<HTMLElement>('[data-choice-key]');
    while(section && section.parentElement!==item) section=section.parentElement;
    if(!section) return;
    for(const figure of Array.from(item.querySelectorAll<HTMLElement>(':scope > [data-question-image], :scope > [data-missing-figure]'))) {
      if(section.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING) { item.insertBefore(figure,section); moved++; }
    }
  });
  return moved;
}

/**
 * T-121: when the new stem is the old stem with whole lines removed (captured table rows), delete exactly those
 * lines and their <br>. A character diff can align inside a word ("สาร|ประกอบ") and break the remaining line.
 */
function removeWholeLines(stem: HTMLElement, oldText: string, newText: string): boolean {
  const oldLines=oldText.split('\n'),newLines=newText.split('\n');
  if(oldLines.length<2||newLines.length>=oldLines.length) return false;
  const groups:Node[][]=[[]];
  for(const child of Array.from(stem.childNodes)) {
    if(child.nodeName==='BR') groups.push([child]); else groups[groups.length-1].push(child);
  }
  const text=(group:Node[])=>group.filter(node=>node.nodeName!=='BR').map(node=>node.textContent||'').join('');
  if(groups.length!==oldLines.length||groups.some((group,index)=>text(group)!==oldLines[index])) return false;
  const keep=new Set<number>();
  let cursor=0;
  for(const line of newLines) {
    while(cursor<oldLines.length&&oldLines[cursor]!==line) cursor++;
    if(cursor===oldLines.length) return false;
    keep.add(cursor++);
  }
  groups.forEach((group,index)=>{ if(!keep.has(index)) group.forEach(node=>node.parentNode?.removeChild(node)); });
  // The first kept line must not start with a line break.
  while(stem.firstChild?.nodeName==='BR') stem.removeChild(stem.firstChild);
  return true;
}

const CHOICE_ORDER=['ก','ข','ค','ง','จ'];
/** Clone an existing choice row (same question first, else any question) as an empty, unanswered row for `key`. */
export function createChoiceRow(root: HTMLElement, item: HTMLElement, key: string): HTMLElement | null {
  const template=item.querySelector<HTMLElement>('[data-choice-key]')||root.querySelector<HTMLElement>('[data-choice-key]');
  if(!template) return null;
  let list=item.querySelector<HTMLElement>('[data-choice-key]')?.parentElement||null;
  // A question whose OCR choices were only keys still renders an empty "ตัวเลือก:" section: reuse its list.
  const emptySection=list?null:Array.from(item.children).find(child=>child.firstElementChild?.textContent?.trim()==='ตัวเลือก:'&&child.children.length>=2) as HTMLElement|undefined;
  if(emptySection) list=emptySection.lastElementChild as HTMLElement;
  if(!list) {
    // The question had no choices at all: copy the choices section ("ตัวเลือก:" + list) from the template's question.
    let section:HTMLElement|null=template;
    while(section&&section.parentElement&&!section.parentElement.hasAttribute('data-item-id')) section=section.parentElement;
    if(!section) return null;
    const copy=section.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[data-choice-key]').forEach(row=>row.remove());
    const explanation=item.querySelector(':scope > [data-explanation-image]')||Array.from(item.children).find(child=>/^\s*คำอธิบาย/.test(child.textContent||''));
    item.insertBefore(copy,explanation||null);
    list=(copy.querySelector('[data-choice-key]')?.parentElement)||Array.from(copy.querySelectorAll<HTMLElement>('div')).pop()||copy;
  }
  const row=template.cloneNode(true) as HTMLElement;
  row.dataset.choiceKey=key;
  row.dataset.answerOrigin='none';
  delete row.dataset.keyInferred;
  row.style.backgroundColor='transparent';
  row.querySelectorAll('[data-choice-image]').forEach(node=>node.remove());
  const walker=document.createTreeWalker(row,NodeFilter.SHOW_TEXT),texts:Text[]=[];let text:Node|null;
  while((text=walker.nextNode())) texts.push(text as Text);
  // The key may be split over several text nodes by React ("ค" + ". "): set it on its element (T-126).
  const keyElement=Array.from(row.querySelectorAll<HTMLElement>('span')).find(span=>!span.closest('[data-export-ignore], [data-answer-marker]')&&/^\s*[ก-จ]\.\s*$/.test(span.textContent||''));
  let keyed=false;
  for(const node of texts) {
    if(node.parentElement?.closest('[data-answer-badge]')||node.parentElement?.closest('[data-answer-marker]')) { node.textContent=''; continue; }
    if(keyElement?.contains(node)) continue;
    if(!keyed&&!keyElement&&/^\s*[ก-จ]\.\s*$/.test(node.textContent||'')) { node.textContent=`${key}. `; keyed=true; } else if(!node.parentElement?.closest('[data-choice-delete]')) node.textContent='';
  }
  if(keyElement) keyElement.textContent=`${key}. `;
  const radio=row.querySelector<HTMLInputElement>('input[data-answer-select]');
  if(radio) { radio.checked=false; radio.removeAttribute('checked'); radio.dataset.answerSelect=key; radio.setAttribute('aria-label',(radio.getAttribute('aria-label')||'').replace(/ตัวเลือก\s+\S+$/,`ตัวเลือก ${key}`)); }
  const next=Array.from(list.querySelectorAll<HTMLElement>(':scope > [data-choice-key]')).find(other=>CHOICE_ORDER.indexOf(other.dataset.choiceKey||'')>CHOICE_ORDER.indexOf(key));
  list.insertBefore(row,next||null);
  return row;
}
