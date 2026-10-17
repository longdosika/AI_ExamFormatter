const fs=require('fs');const f='lib/harvest-editor.ts';let s=fs.readFileSync(f,'utf8');
const a="      const row=Array.from(node.querySelectorAll<HTMLElement>('[data-choice-key]')).find(row=>row.dataset.choiceKey===choice.key);\n      if(row) setFigure";
if(!s.includes(a))throw new Error('anchor');
s=s.replace(a,()=>"      let row=Array.from(node.querySelectorAll<HTMLElement>('[data-choice-key]')).find(row=>row.dataset.choiceKey===choice.key);\n      // T-121 (audit, source1 Q16): image-only choices exist only after harvest; give them a row instead of dropping the image.\n      if(!row&&choice.imageUrl) row=createChoiceRow(clone,node,choice.key)||undefined;\n      if(row) setFigure");
s+=`
const CHOICE_ORDER=['ก','ข','ค','ง','จ'];
/** Clone an existing choice row (same question first, else any question) as an empty, unanswered row for \`key\`. */
function createChoiceRow(root: HTMLElement, item: HTMLElement, key: string): HTMLElement | null {
  const template=item.querySelector<HTMLElement>('[data-choice-key]')||root.querySelector<HTMLElement>('[data-choice-key]');
  if(!template) return null;
  let list=item.querySelector<HTMLElement>('[data-choice-key]')?.parentElement||null;
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
  let keyed=false;
  for(const node of texts) {
    if(node.parentElement?.closest('[data-answer-badge]')||node.parentElement?.closest('[data-answer-marker]')) { node.textContent=''; continue; }
    if(!keyed&&/^\s*[ก-จ]\.\s*$/.test(node.textContent||'')) { node.textContent=\`\${key}. \`; keyed=true; } else node.textContent='';
  }
  const radio=row.querySelector<HTMLInputElement>('input[data-answer-select]');
  if(radio) { radio.checked=false; radio.removeAttribute('checked'); radio.dataset.answerSelect=key; radio.setAttribute('aria-label',(radio.getAttribute('aria-label')||'').replace(/ตัวเลือก\s+\S+$/,\`ตัวเลือก \${key}\`)); }
  const next=Array.from(list.querySelectorAll<HTMLElement>(':scope > [data-choice-key]')).find(other=>CHOICE_ORDER.indexOf(other.dataset.choiceKey||'')>CHOICE_ORDER.indexOf(key));
  list.insertBefore(row,next||null);
  return row;
}
`;
fs.writeFileSync(f,s);console.log('ok');
