const fs = require('fs');
const usage = () => {
  const content = fs.readFileSync(__dirname + '/docs/usage.txt').toString('utf-8');
  process.stdout.write(content);
  process.stdout.write('\n');

};
module.exports.default = usage;