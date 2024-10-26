const fs = require('fs');
const path = require('path');

const expensesPath = path.join(__dirname, 'expenses.csv');
const revenuePath = path.join(__dirname, 'revenue.csv');
const outputPath = path.join(__dirname, 'combined.csv');

const combineCSV = (files, output) => {
  let combined = '';
  files.forEach(file => {
    const data = fs.readFileSync(file, 'utf8');
    combined += data;
  });
  fs.writeFileSync(output, combined);
};

combineCSV([expensesPath, revenuePath], outputPath);
console.log('CSV files combined successfully!');
