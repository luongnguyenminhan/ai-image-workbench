import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = ['index.html', 'studio.html'];
const failures = [];

for (const file of files) {
  const body = fs.readFileSync(path.join(root, file), 'utf8');
  if (body.includes('\uFFFD') || /[\u3400-\u9fff]/u.test(body)) {
    failures.push(`${file}: contains broken encoding or untranslated CJK text.`);
  }
}

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const studioHtml = fs.readFileSync(path.join(root, 'studio.html'), 'utf8');

if (!indexHtml.includes('AI Image Workbench')) {
  failures.push('index.html: root entry should present the provider-neutral AI Image Workbench name.');
}

if (indexHtml.includes('image-sub2api-studio open-source Sub2API image generation workstation')) {
  failures.push('index.html: root entry still describes the project as a Sub2API-only workstation.');
}

if (!studioHtml.includes('Không gian sáng tạo')) {
  failures.push('studio.html: Studio title should be readable Vietnamese.');
}

if (!studioHtml.includes('API tương thích OpenAI') || !studioHtml.includes('NewAPI')) {
  failures.push('studio.html: Studio description should mention provider-neutral compatible APIs.');
}

if (failures.length) {
  console.error(`HTML entrypoint check failed:\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('HTML entrypoint check passed.');
