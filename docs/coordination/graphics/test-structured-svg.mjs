import { createHash } from 'node:crypto';
import { renderVariant } from './structured-svg-benchmark.mjs';

const variants = ['baseline','move-qpu','add-gpu','fork-join'];
for (const name of variants) {
  const a = renderVariant(name);
  const b = renderVariant(name);
  if (a !== b) throw new Error(`${name}: nondeterministic output`);
  for (const token of ['role="img"','<title','<desc','data-node-id=']) {
    if (!a.includes(token)) throw new Error(`${name}: missing ${token}`);
  }
  if (name === 'add-gpu' && !a.includes('data-node-id="gpu"')) throw new Error('GPU missing');
  if (name === 'fork-join' && (!a.includes('data-anchor-id="fork"') || !a.includes('data-anchor-id="join"'))) throw new Error('fork/join anchors missing');
  const hash = createHash('sha256').update(a).digest('hex').slice(0,16);
  console.log(`${name}: ${Buffer.byteLength(a)} bytes sha256=${hash}`);
}
