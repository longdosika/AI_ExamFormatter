"""Read-only source inspection: coordinate overlays for crop ownership review."""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json

out = Path('evidence/t058-roi')
out.mkdir(parents=True, exist_ok=True)
sources = ['evidence/t038-page1-1.png', 'evidence/pdf-review/page-2.png', 'evidence/pdf-review/page-3.png']
for page, source in enumerate(sources, 1):
    image = Image.open(source).convert('RGB')
    overlay = image.copy()
    draw = ImageDraw.Draw(overlay)
    for y in range(0, image.height, 100):
        draw.line((0, y, image.width, y), fill=(0, 150, 200), width=1)
        draw.text((3, y + 3), str(y), fill=(0, 90, 160))
    for x in range(0, image.width, 100):
        draw.line((x, 0, x, image.height), fill=(0, 150, 200), width=1)
        draw.text((x + 3, 5), str(x), fill=(0, 90, 160))
    overlay.save(out / f'grid-page-{page}.png')
    print(page, image.size)

# Pixel boxes reviewed against the coordinate-grid source images. Inference uses
# untouched source pixels, never the grid overlay or the QA contact sheets.
boxes = {
    1: [(1, (90,380,930,480), 'ก'), (2,(90,485,930,575),'ก'), (3,(90,575,930,702),'ง'),
        (4,(90,703,930,795),'ค'), (5,(90,797,930,1158),'ง'), (6,(90,1160,930,1310),'ง')],
    2: [(7,(125,190,850,430),'ค'), (8,(125,439,850,909),'ค'),
        (9,(125,916,900,1070),'ข'), (10,(120,1073,930,1310),'ข')],
    3: [(11,(90,182,930,278),'ง'),(12,(90,282,930,340),'ง'),(13,(50,342,930,400),None),
        (14,(90,405,930,497),'ก'),(15,(90,504,930,593),'ข'),(16,(90,597,930,894),'ก'),
        (17,(90,896,930,987),'ข'),(18,(90,990,930,1049),'ง'),(19,(90,1053,930,1145),'ค'),
        (20,(90,1147,930,1310),'ก')],
}
fixtures = []
for page, rows in boxes.items():
    source = sources[page - 1]
    image = Image.open(source).convert('RGB')
    sheet = Image.new('RGB', (1240, ((len(rows)+1)//2)*420), 'white')
    draw = ImageDraw.Draw(sheet)
    for index, (question, box, key) in enumerate(rows):
        crop = image.crop(box)
        file = out / f'q{question:02d}.png'
        crop.save(file)
        fixtures.append({'caseId':f'q{question}', 'page':page, 'file':file.as_posix(),
            'sourceFile':source, 'sourceBox':list(box), 'sourceImageSize':list(image.size),
            'sourceOriginalSha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),
            'truth':{str(question):key}})
        x, y = (index % 2)*620, (index//2)*420
        draw.text((x+8,y+4), f'Q{question} | expected {key or "no unique choice"}', fill='black')
        preview = crop.copy()
        preview.thumbnail((604,390))
        sheet.paste(preview, (x+8,y+24))
    sheet.save(out / f'qa-page-{page}.png')
(out/'roi-manifest.json').write_text(json.dumps({'truthProvenance':'Owner confirmed teacher-rechecked answers; crops visually reviewed before inference', 'fixtures':fixtures},ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared', len(fixtures), 'ROI cases; contact sheets are QA-only, not model input')
