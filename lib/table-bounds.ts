/** Locate ruled grids only. Unruled/ambiguous tables remain a review item, never guessed. */
export function detectRuledTable(data: Uint8ClampedArray, width: number, height: number, limits: [number, number, number, number]): [number, number, number, number] | null {
  const top = Math.max(0,Math.ceil(limits[0]*height/1000)), bottom = Math.min(height,Math.floor(limits[2]*height/1000));
  const left = Math.max(0,Math.ceil(limits[1]*width/1000)), right = Math.min(width,Math.floor(limits[3]*width/1000));
  const dark = (x:number,y:number) => { const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2]; return Math.max(r,g,b)-Math.min(r,g,b)<65 && (r+g+b)/3<225; };
  const maxGap=Math.max(2,Math.round(width*.006));
  const bands: Array<{top:number;bottom:number;left:number;right:number}> = [];
  for(let y=top;y<bottom;y++) {
    let start=-1,last=-1,gap=0,best:[number,number]|null=null;
    for(let x=left;x<=right;x++) {
      if(x<right && dark(x,y)) { if(start<0) start=x; last=x; gap=0; }
      else if(start>=0 && ++gap>maxGap) { if(!best||last-start>best[1]-best[0]) best=[start,last]; start=-1; }
    }
    if(start>=0 && (!best||last-start>best[1]-best[0])) best=[start,last];
    if(!best || best[1]-best[0]<width*.2) continue;
    const prev=bands[bands.length-1];
    if(prev && y-prev.bottom<=3) { prev.bottom=y;prev.left=Math.min(prev.left,best[0]);prev.right=Math.max(prev.right,best[1]); }
    else bands.push({top:y,bottom:y,left:best[0],right:best[1]});
  }
  const groups: typeof bands[]=[];
  for(const band of bands) {
    const group=groups[groups.length-1], prev=group?.[group.length-1];
    const groupLeft=group ? Math.min(...group.map(row=>row.left)) : 0,groupRight=group ? Math.max(...group.map(row=>row.right)) : 0;
    const overlap=prev ? Math.min(groupRight,band.right)-Math.max(groupLeft,band.left) : 0;
    const rowGap=Math.max(height*.1,Math.min(groupRight-groupLeft,band.right-band.left)*.5);
    if(prev && band.top-prev.bottom<rowGap && overlap>Math.min(groupRight-groupLeft,band.right-band.left)*.6) group.push(band);
    else groups.push([band]);
  }
  const candidates=groups.filter(group=>group.length>=2).filter(group=>{
    const t=group[0].top,b=group[group.length-1].bottom,l=Math.min(...group.map(v=>v.left)),r=Math.max(...group.map(v=>v.right));
    let verticals=0,was=false;
    for(let x=l;x<=r;x++) {
      let count=0;
      for(let y=t;y<=b;y++) if(Array.from({length:9},(_,i)=>x+i-4).some(xx=>xx>=0&&xx<width&&dark(xx,y))) count++;
      const line=count>=(b-t+1)*.65;
      if(line&&!was) verticals++; was=line;
    }
    return verticals>=3;
  });
  if(candidates.length!==1) return null;
  const group=candidates[0];
  return [Math.max(limits[0],(group[0].top-4)*1000/height),Math.max(limits[1],(Math.min(...group.map(v=>v.left))-4)*1000/width),Math.min(limits[2],(group[group.length-1].bottom+5)*1000/height),Math.min(limits[3],(Math.max(...group.map(v=>v.right))+5)*1000/width)];
}
