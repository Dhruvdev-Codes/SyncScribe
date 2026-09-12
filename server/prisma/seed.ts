import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { defaultTemplates } from '../src/controllers/templateController';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 0. Seed default developer/admin account (idempotent upsert)
  const devEmail = process.env.DEV_SEED_EMAIL || 'dhruv@syncscribe.dev';
  const devPassword = process.env.DEV_SEED_PASSWORD || 'SyncScribeDev2024!';
  const existingDev = await prisma.user.findUnique({ where: { email: devEmail } });
  if (!existingDev) {
    const hashedPassword = await bcrypt.hash(devPassword, 12);
    await prisma.user.create({
      data: {
        email: devEmail,
        password: hashedPassword,
        name: 'Dhruv (Developer)',
        color: '#06b6d4',
        role: 'developer',
      },
    });
    console.log(`✅ Default developer account seeded: ${devEmail}`);
  } else {
    console.log(`⏭️  Developer account already exists: ${devEmail}`);
  }

  // 1. Seed Templates
  for (const template of defaultTemplates) {
    await prisma.documentTemplate.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
  }
  console.log('✅ Templates seeded.');

  // 2. Seed Sample Document
  const docId = 'welcome-doc-101';
  const existingDoc = await prisma.document.findUnique({ where: { id: docId } });

  if (!existingDoc) {
    const doc = await prisma.document.create({
      data: {
        id: docId,
        title: '🚀 Welcome to SyncScribe',
        icon: '✨',
        tags: JSON.stringify(['guide', 'collaboration', 'ai']),
        content: `<h1>Welcome to SyncScribe 🚀</h1>
<p>SyncScribe is your real-time collaborative document workspace supercharged with an integrated AI Copilot.</p>
<hr/>
<h2>✨ Core Capabilities</h2>
<ul>
  <li><strong>Real-Time Multiplayer:</strong> Open this document in multiple browser tabs or share the URL with colleagues to witness live cursor tracking, typing indicators, and zero-conflict sync.</li>
  <li><strong>Inline AI Assistant:</strong> Highlight any text to rewrite, shorten, expand, or fix grammar. Press <strong>Ctrl + K</strong> to generate new ideas directly inline!</li>
  <li><strong>Version Snapshots:</strong> Time-travel through revisions, compare diffs, and restore with one click.</li>
  <li><strong>Inline Comments & Team Chat:</strong> Discuss ideas right inside your workspace.</li>
</ul>
<blockquote>"SyncScribe combines the speed of Google Docs with the intelligence of modern AI models."</blockquote>
<h2>Try It Now</h2>
<p>Highlight this sentence to see the floating AI toolbar appear!</p>`,
        plainText: `Welcome to SyncScribe 🚀\nSyncScribe is your real-time collaborative document workspace supercharged with an integrated AI Copilot.\n\nCore Capabilities:\n- Real-Time Multiplayer\n- Inline AI Assistant\n- Version Snapshots\n- Inline Comments & Team Chat`,
      },
    });

    // Seed Version 1
    await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: 1,
        title: doc.title,
        content: doc.content,
        plainText: doc.plainText,
        description: 'Initial Welcome Document',
        authorName: 'SyncScribe Team',
      },
    });

    // Seed sample comment
    await prisma.comment.create({
      data: {
        documentId: doc.id,
        authorName: 'Dhruv (Lead)',
        authorColor: '#3b82f6',
        text: 'Welcome to the platform! Feel free to test out multi-cursor editing.',
        selectedText: 'Real-Time Multiplayer',
        resolved: false,
      },
    });

    console.log('✅ Welcome document and sample comments seeded.');
  }

  console.log('🎉 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
