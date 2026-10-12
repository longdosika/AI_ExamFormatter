from PIL import Image, ImageOps
import json
from pathlib import Path
root=Path('evidence')
pages={i:Image.open(root/f't041-source-{i}.png') for i in range(1,5)}
print({i:p.size for i,p in pages.items()})
# Coordinates are fractions of the visually reviewed source page, not OCR guesses.
regions={8:(2,[.20,.332,.79,.469]),16:(3,[.14,.446,.69,.563]),20:(3,[.16,.823,.30,.93]),22:(4,[.22,.21,.435,.309])}
manifest=[]
for question,(page,box) in regions.items():
 im=pages[page]; bbox=[round(box[j]*im.size[j%2]) for j in range(4)]
 im.crop(bbox).save(root/f't041-question-{question}.png')
 manifest.append(dict(question_no=question,source_page=page,bbox=bbox,owner_type='question',crop_quality='pending_visual_check'))
im=pages[4]
boxes=[[.105,.583,.51,.775],[.535,.589,.90,.775],[.15,.775,.26,.944],[.32,.793,.455,.944]]
crops=[im.crop(tuple(round(b[j]*im.size[j%2]) for j in range(4))) for b in boxes]
canvas=Image.new('RGB',(1100,850),'white')
for crop,(x,y) in zip(crops,[(0,0),(570,0),(0,440),(570,440)]):
 crop.thumbnail((520,395)); canvas.paste(crop,(x,y))
canvas.save(root/'t041-question-25.png')
manifest.append(dict(question_no=25,source_page=4,source_regions=boxes,owner_type='question',crop_quality='pending_visual_check'))
(root/'t041-media-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
