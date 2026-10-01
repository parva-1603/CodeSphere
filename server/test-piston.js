const testPiston = async () => {
  const res = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'javascript',
      version: '18.15.0',
      files: [{ name: 'test.js', content: 'console.log("hello");' }]
    }) 
  });
  console.log(res.status);
  console.log(await res.text());
};
testPiston();
