const ts = require('typescript');
const fs = require('fs');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText, filename);
};
const { parseExamText } = require('../lib/exam-parser.ts');

const text = [
  '1. ใน การ เลือก วิธี แยก สาร ผ สมควร พิจารณา จาก สิ่ง ใด',
  '1. สถานะ ของ สาร',
  '2. จุดเดือด และ จุดหลอมเหลว ของ สาร',
  '3. ลักษณะ เนื้อ สาร',
  '4. การ ละลาย น้ำ',
  '2. วิธี การ ใด ใช้ แยก สาร เนื้อ เดียว ได้ ทั้งหมด',
  '1. การ กรอง และ การ ระเหย',
  '2. โค ร มา โท ก รา ฟี และ การ กลั่น',
  '3. การ ตกผลึก และ การ ใช้ แม่เหล็ก',
  '4. การ ระเหิด และ การ สกัด ด้วย ตัว ทำ ละลาย',
  '3. นำ ของเหลว ชนิด หนึ่ง มา ต้ม ใน ถาด หลุม โลหะ จน แห้ง ปรากฏ ว่า ไม่มี สาร ใด เหลือ อยู่ บน ถาด หลุม แสดง ว่า ของเหลว นี้ เป็น สาร ประเภท ใด',
  '1. สารละลาย',
  '2. สาร แขวนลอย',
  '3. สาร บริสุทธิ์',
  '4. สรุป ไม่ ได้'
].join('\n');

const items = parseExamText(text);
console.log('Parsed count:', items.length);
for (const it of items) {
  console.log('Q' + it.questionNumber + ': ' + it.questionText);
  console.log('  Choices:', it.choices.map(c => c.key + '. ' + c.text).join(' | '));
}
