const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, filename);
};
const { parseExamText } = require('../lib/exam-parser.ts');

const sampleText = `ตะลุยโจทย์สอบเข้า ม.1 | พี่จูเนียร์
บทที่ 7 การแยกสาร
1. ในการเลือกวิธีแยกสารผสมควรพิจารณาจากสิ่งใด
1. สถานะของสาร
2. จุดเดือดและจุดหลอมเหลวของสาร
3. ลักษณะเนื้อสาร
4. การละลายน้ำ
2. วิธีการใดใช้แยกสารเนื้อเดียวได้ทั้งหมด
1. การกรองและการระเหย
2. โครมาโทกราฟีและการกลั่น
3. การตกผลึกและการใช้แม่เหล็ก
4. การระเหิดและการสกัดด้วยตัวทำละลาย
3. นำของเหลวชนิดหนึ่งมาต้มในถาดหลุมโลหะจนแห้งปรากฏว่าไม่มีสารใดเหลืออยู่บนถาดหลุม แสดงว่าของเหลวนี้เป็นสารประเภทใด
1. สารละลาย
2. สารแขวนลอย
3. สารบริสุทธิ์
4. สรุปไม่ได้`;

const items = parseExamText(sampleText);
console.log('Parsed items length:', items.length);
for (const it of items) {
  console.log('Q' + it.questionNumber + ':', it.questionText);
  console.log('  Choices:', it.choices.map(c => c.key + '. ' + c.text).join(' | '));
}
