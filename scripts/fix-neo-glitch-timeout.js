#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the neo-glitch-generate.ts file
const filePath = path.join(__dirname, '../netlify/functions/neo-glitch-generate.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find the section where we process the generation
const processSection = `    // Process the generation immediately (Stability.ai is synchronous)
    console.log('🚀 [NeoGlitch] About to call processGenerationAsync...');
    let generationResult;
    try {
      generationResult = await processGenerationAsync(initialRecord.id, sourceUrl, prompt, presetKey, userId, runId, userToken);
      console.log('✅ [NeoGlitch] processGenerationAsync completed:', !!generationResult);
    } catch (error) {
      console.error('❌ [NeoGlitch] processGenerationAsync failed:', error);
      // Update status to failed in database
      await q(\`UPDATE neo_glitch_media SET status = 'failed' WHERE id = $1\`, [initialRecord.id]);
      throw error;
    }`;

// Replace with immediate response and background processing
const newSection = `    // Return immediately with pending status
    console.log('🚀 [NeoGlitch] Returning immediate response, processing in background...');
    
    // Process in background without awaiting
    processGenerationAsync(initialRecord.id, sourceUrl, prompt, presetKey, userId, runId, userToken)
      .then(result => {
        console.log('✅ [NeoGlitch] Background processing completed:', !!result);
      })
      .catch(error => {
        console.error('❌ [NeoGlitch] Background processing failed:', error);
        // Update status to failed in database
        q(\`UPDATE neo_glitch_media SET status = 'failed' WHERE id = $1\`, [initialRecord.id])
          .catch(dbError => console.error('❌ Failed to update failed status:', dbError));
      });`;

// Replace the content
content = content.replace(processSection, newSection);

// Remove the section that tries to return the generation result
const returnSection = `    return {
      statusCode: 200,
      body: JSON.stringify(generationResult)
    };`;

const newReturnSection = `    // Return immediately with pending status
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'pending',
        runId: runId,
        message: 'Generation started, processing in background'
      })
    };`;

content = content.replace(returnSection, newReturnSection);

// Write the updated content
fs.writeFileSync(filePath, content);

console.log('✅ Fixed neo-glitch-generate.ts to respond immediately and process in background');
