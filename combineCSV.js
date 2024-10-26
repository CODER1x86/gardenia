const fs = require('fs');
const path = require('path');

const expensesPath = path.join(__dirname, 'expenses.csv');
const revenuePath = path.join(__dirname, 'revenue.csv');
const outputPath = path.join(__dirname, 'combined.csv');

const combineCSV = (files, output) => {
  let combined = '';
  let firstFile = true;

  files.forEach(file => {
    const data = fs.readFileSync(file, 'utf8');
    if (!data) {
      console.error(`Error reading file: ${file}`);
      return;
    }

    // If not the first file, remove the header
    if (!firstFile) {
      const lines = data.split('\n');
      lines.shift();
      combined += '\n' + lines.join('\n');
    } else {
      combined += data;
      firstFile = false;
    }
  });

  // Ensure we actually write to the output file
  fs.writeFile(output, combined, (err) => {
    if (err) {
      console.error('Error writing to combined.csv:', err);
    } else {
      console.log('CSV files combined and saved successfully!');
    }
  });
};

// Debugging to check contents
fs.readFile(expensesPath, 'utf8', (err, data) => {
  if (err) throw err;
  console.log('Expenses CSV Contents:\n', data);
});
fs.readFile(revenuePath, 'utf8', (err, data) => {
  if (err) throw err;
  console.log('Revenue CSV Contents:\n', data);
});

// Combine and save the CSV files
combineCSV([expensesPath, revenuePath], outputPath);
