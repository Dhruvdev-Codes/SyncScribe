// test-copilot-intents.mjs
import { aiApi } from './client/src/services/api.js';

async function runCopilotTests() {
  console.log('====================================================');
  console.log('   SYNCSCRIBE AI COPILOT INTENT VERIFICATION SUITE   ');
  console.log('====================================================\n');

  const testCases = [
    {
      name: '1. Casual Greeting ("hii")',
      prompt: 'hii',
      validate: (res) => {
        const lower = res.toLowerCase();
        return !lower.includes('executive summary') && !lower.includes('introduction & background') && (lower.includes('hello') || lower.includes('hi') || lower.includes('copilot'));
      }
    },
    {
      name: '2. Capability Inquiry ("What can you do?")',
      prompt: 'What can you do?',
      validate: (res) => {
        const lower = res.toLowerCase();
        return lower.includes('help') || lower.includes('draft') || lower.includes('summarize');
      }
    },
    {
      name: '3. Leave Application Email ("Write an email requesting sick leave")',
      prompt: 'Write an email requesting sick leave',
      validate: (res) => {
        const lower = res.toLowerCase();
        return lower.includes('subject:') && lower.includes('leave') && !lower.includes('introduction & background');
      }
    },
    {
      name: '4. Resignation Letter ("Draft a resignation letter")',
      prompt: 'Draft a resignation letter',
      validate: (res) => {
        const lower = res.toLowerCase();
        return lower.includes('subject:') && lower.includes('resign') && !lower.includes('introduction & background');
      }
    },
    {
      name: '5. Code Generation ("Write a python script to parse a CSV file")',
      prompt: 'Write a python script to parse a CSV file',
      validate: (res) => {
        const lower = res.toLowerCase();
        return lower.includes('```') || lower.includes('def ') || lower.includes('python');
      }
    },
    {
      name: '6. Conceptual Question ("What is WebSockets and how does it work?")',
      prompt: 'What is WebSockets and how does it work?',
      validate: (res) => {
        return !res.includes('## 1. Introduction & Background') && !res.includes('## 2. Key Objectives & Pillars');
      }
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    console.log(`\n--- Running Test: ${tc.name} ---`);
    console.log(`Prompt: "${tc.prompt}"`);
    try {
      const res = await aiApi.chat({ message: tc.prompt });
      const output = res.response || res.answer || res.text || '';
      console.log(`Response Preview:\n----------------------------------------\n${output.trim()}\n----------------------------------------`);
      
      const isValid = tc.validate(output);
      if (isValid) {
        console.log(`✅ [PASS] ${tc.name}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${tc.name} - Output validation failed!`);
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${tc.name} encountered error:`, err);
    }
  }

  console.log(`\n====================================================`);
  console.log(`   RESULTS: ${passed} / ${testCases.length} TESTS PASSED`);
  console.log(`====================================================`);

  if (passed !== testCases.length) {
    process.exit(1);
  }
}

runCopilotTests();