const filesMapKeys = ['src', 'src/App.js', 'package.json'];
const filesMap = new Map([
  ['src', { type: 'folder' }],
  ['src/App.js', { type: 'file' }],
  ['package.json', { type: 'file' }]
]);

const tree = {};
filesMapKeys.forEach(path => {
  const parts = path.split('/');
  let current = tree;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {
        name: part,
        path: parts.slice(0, i + 1).join('/'),
        isFolder: i < parts.length - 1 || filesMap.get(path)?.type === 'folder',
        children: {}
      };
    }
    current = current[part].children;
  }
});

console.log(JSON.stringify(tree, null, 2));
