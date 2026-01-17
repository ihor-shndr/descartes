#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts a markdown file to JSON format where empty lines separate pages
 * Each line becomes a quoted string in the lines array
 */
function convertMdToJson(mdFilePath, outputJsonPath, startPage = 1) {
  // Read the markdown file
  const content = fs.readFileSync(mdFilePath, 'utf-8');
  const lines = content.split('\n');

  const pages = [];
  let currentPageLines = [];
  let pageNumber = startPage;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip lines that are just numbers (line numbers)
    if (trimmed !== '' && /^\d+$/.test(trimmed)) {
      continue;
    }

    // Empty line marks the end of a page
    if (trimmed === '') {
      if (currentPageLines.length > 0) {
        // Create a page with the collected lines
        pages.push({
          pageNumber: pageNumber++,
          paragraphs: [
            {
              lines: currentPageLines
            }
          ]
        });
        currentPageLines = [];
      }
    } else {
      // Add line to current page (preserving original formatting)
      currentPageLines.push(line);
    }
  }

  // Add the last page if there are remaining lines
  if (currentPageLines.length > 0) {
    pages.push({
      pageNumber: pageNumber,
      paragraphs: [
        {
          lines: currentPageLines
        }
      ]
    });
  }

  // Create the final JSON structure
  const jsonOutput = {
    pages: pages
  };

  // Write to output file with pretty formatting
  fs.writeFileSync(outputJsonPath, JSON.stringify(jsonOutput, null, 4), 'utf-8');

  console.log(`✓ Converted ${mdFilePath} to ${outputJsonPath}`);
  console.log(`  Total pages: ${pages.length}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Usage: node md-to-json.js <input.md> [output.json] [startPage]');
  console.log('Example: node md-to-json.js public/meditations/text/la.md public/meditations/text/la-converted.json 7');
  process.exit(1);
}

const inputPath = args[0];
const outputPath = args[1] || inputPath.replace('.md', '-converted.json');
const startPage = args[2] ? parseInt(args[2], 10) : 1;

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

if (isNaN(startPage) || startPage < 1) {
  console.error(`Error: Start page must be a positive number`);
  process.exit(1);
}

convertMdToJson(inputPath, outputPath, startPage);

export { convertMdToJson };
