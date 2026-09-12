import { Request, Response } from 'express';
import prisma from '../db';

export const defaultTemplates = [
  {
    id: 'template-prd',
    name: 'Product Requirements Document (PRD)',
    description: 'Comprehensive spec for engineering and product features.',
    category: 'Product',
    icon: '🚀',
    content: `<h1>Product Requirements Document (PRD)</h1>
<p><strong>Status:</strong> 🟡 In Review | <strong>Author:</strong> Product Lead | <strong>Date:</strong> 2026-09-12</p>
<hr/>
<h2>1. Executive Summary & Problem Statement</h2>
<p>Clearly state the customer problem, market context, and high-level objective of this initiative.</p>
<h2>2. Goals & Success Metrics (OKRs)</h2>
<ul>
  <li><strong>Metric 1:</strong> Increase daily active collaboration by 35%.</li>
  <li><strong>Metric 2:</strong> Sub-50ms latency for all real-time sync operations.</li>
  <li><strong>Metric 3:</strong> 99.99% uptime across distributed regions.</li>
</ul>
<h2>3. User Personas & Stories</h2>
<blockquote>"As an engineering lead, I want to edit technical specs simultaneously with my squad and get instant AI-assisted architecture reviews."</blockquote>
<h2>4. Functional Requirements</h2>
<ul>
  <li>Real-time multi-cursor awareness and presence.</li>
  <li>AI-assisted content generation and contextual tone refinement.</li>
  <li>Version history snapshots and time-travel rollbacks.</li>
</ul>
<h2>5. Technical Considerations</h2>
<p>Outline database schemas, WebSocket payload contracts, and microservice APIs.</p>`,
  },
  {
    id: 'template-meeting-notes',
    name: 'Engineering Sprint & Meeting Notes',
    description: 'Structured agenda, discussion points, action items, and attendees.',
    category: 'Team',
    icon: '👥',
    content: `<h1>Engineering Sync & Meeting Notes</h1>
<p><strong>Date:</strong> 2026-09-12 | <strong>Time:</strong> 10:00 AM PST | <strong>Facilitator:</strong> Tech Lead</p>
<hr/>
<h2>👥 Attendees</h2>
<ul>
  <li>Dhruv (Lead Architect)</li>
  <li>Alex (Full-Stack Engineer)</li>
  <li>Maya (Product Designer)</li>
</ul>
<h2>🎯 Agenda</h2>
<ol>
  <li>Sprint goals review and blocker triage.</li>
  <li>AI microservice streaming performance analysis.</li>
  <li>Deployment and automated CI/CD pipeline check.</li>
</ol>
<h2>✅ Action Items</h2>
<ul>
  <li>[ ] <strong>@Alex:</strong> Benchmark Socket.IO connection limits under simulated stress.</li>
  <li>[ ] <strong>@Maya:</strong> Deliver finalized dark-mode tokens for editor toolbar.</li>
</ul>`,
  },
  {
    id: 'template-technical-rfc',
    name: 'Technical Design RFC',
    description: 'Architecture blueprint, trade-offs, security, and schema designs.',
    category: 'Engineering',
    icon: '⚡',
    content: `<h1>RFC: High-Throughput Real-Time Collaborative Architecture</h1>
<p><strong>Author:</strong> Team | <strong>Target Engine:</strong> SyncScribe v1.0</p>
<hr/>
<h2>1. Abstract</h2>
<p>This RFC proposes an operational transform and state-sync protocol designed for zero-latency multiplayer document editing paired with streaming AI completion.</p>
<h2>2. Proposed Architecture</h2>
<pre><code>interface SyncPayload {
  documentId: string;
  delta: any;
  version: number;
  userId: string;
}</code></pre>`,
  },
  {
    id: 'template-brainstorm',
    name: 'Brainstorming & Ideation Board',
    description: 'Freeform collaborative sandbox for new concepts and strategic ideas.',
    category: 'Ideation',
    icon: '💡',
    content: `<h1>💡 Innovation Sandbox: Next-Gen Features</h1>
<p>Collaborative brainstorming board. Add your thoughts below or highlight text to invoke AI ideation.</p>
<hr/>
<h2>🧠 Core Theme: AI-Native Collaboration</h2>
<ul>
  <li>Auto-generating executive summaries when documents surpass 1,000 words.</li>
  <li>Automated action item extraction from meeting minutes into task trackers.</li>
  <li>Multi-language live translation for globally distributed squads.</li>
</ul>`,
  },
];

export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    let templates = await prisma.documentTemplate.findMany({
      orderBy: { name: 'asc' },
    });

    if (templates.length === 0) {
      for (const t of defaultTemplates) {
        await prisma.documentTemplate.create({
          data: t,
        });
      }
      templates = await prisma.documentTemplate.findMany({
        orderBy: { name: 'asc' },
      });
    }

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.json(defaultTemplates);
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let template = await prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      template = defaultTemplates.find((t) => t.id === id) as any;
    }

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

