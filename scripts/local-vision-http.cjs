const http = require('node:http');
// Experiment-only loopback transport: consume NDJSON without fetch header deadlines.
function postLocal(url, body, timeoutMs) {
  const target = new URL(url);
  if (target.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(target.hostname)) throw new Error('Loopback HTTP only');
  return new Promise((resolve, reject) => {
    let content = '', thinking = '', buffer = '', final, firstTokenSeconds; const chunks=[];
    const started = Date.now();
    const req = http.request(target, { method: 'POST', headers: {'Content-Type':'application/json'} }, res => {
      res.setEncoding('utf8');
      function consume(line) {
        if (!line.trim()) return;
        const part = JSON.parse(line);
        chunks.push(part);
        if (part.error) throw new Error(part.error);
        if (part.message?.content) {
          firstTokenSeconds ??= (Date.now()-started)/1000;
          content += part.message.content;
        }
        if (part.message?.thinking) { firstTokenSeconds ??= (Date.now()-started)/1000; thinking+=part.message.thinking; }
        final = part;
      }
      res.on('data', chunk => {
        buffer += chunk;
        if (!body.stream) return;
        try {
          let newline;
          while ((newline=buffer.indexOf('\n'))>=0) {
            consume(buffer.slice(0,newline)); buffer=buffer.slice(newline+1);
          }
        } catch (error) { clearTimeout(timer); reject(error); res.destroy(); req.destroy(); }
      });
      res.on('error', reject);
      res.on('end', () => {
        clearTimeout(timer);
        try {
          consume(buffer);
          if (res.statusCode !== 200) throw new Error('HTTP '+res.statusCode);
          if (body.stream && final?.done !== true) throw new Error('Incomplete inference stream');
          resolve(body.stream ? {...final,message:{content,thinking},firstTokenSeconds,streamChunks:chunks} : final);
        } catch(error) { reject(error); }
      });
    });
    const timer=setTimeout(()=>req.destroy(Object.assign(new Error('Overall inference timeout'),{code:'INFERENCE_TIMEOUT'})),timeoutMs);
    req.on('error', error=>{clearTimeout(timer);reject(error);});
    req.end(JSON.stringify(body));
  });
}
module.exports={postLocal};
