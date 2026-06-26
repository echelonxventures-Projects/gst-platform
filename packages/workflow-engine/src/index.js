import { db } from '@gst-platform/core/db';
import { sourceEngine } from '@gst-platform/source-engine';
import { hsnParser } from '@gst-platform/parser-engine';
import { sourceRegistry } from '@gst-platform/registry-engine/sources';
import { onSourceChanged } from '@gst-platform/event-engine';
import path from 'path';
import { config } from '@gst-platform/core/config';

export class WorkflowOrchestrator {
  constructor() {
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    onSourceChanged(async (event) => {
      console.log('Source changed event received:', event.payload.sourceCode);
      await this.handleSourceChanged(event.payload);
    });
  }

  async handleSourceChanged(payload) {
    const { sourceCode, documentCode, checksum } = payload;

    try {
      const source = await sourceRegistry.get(sourceCode);
      if (!source) return;

      if (source.type === 'pdf') {
        const filePath = path.join(
          config.storage.documentsPath,
          `${documentCode}.pdf`
        );

        await hsnParser.parseAndStore(filePath, source.id, documentCode);
      }
    } catch (error) {
      console.error('Workflow error:', error.message);
    }
  }

  async executeFullWorkflow() {
    console.log('Starting full workflow: Fetch → Parse → Store');

    const results = await sourceEngine.processAllSources();

    for (const result of results) {
      if (result.status === 'changed') {
        await this.handleSourceChanged({
          sourceCode: result.source,
          documentCode: result.documentCode,
          checksum: result.checksum
        });
      }
    }

    console.log('Workflow completed');
    return results;
  }

  async scheduleJob(jobType, jobData, scheduledAt = new Date()) {
    const result = await db.query(
      `INSERT INTO workflow.jobs (job_type, job_data, scheduled_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [jobType, JSON.stringify(jobData), scheduledAt]
    );
    return result.rows[0];
  }

  async getPendingJobs(limit = 10) {
    const result = await db.query(
      `SELECT * FROM workflow.jobs
       WHERE status = 'pending' AND scheduled_at <= now()
       ORDER BY scheduled_at ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async markJobStarted(jobId) {
    await db.query(
      `UPDATE workflow.jobs
       SET status = 'running', started_at = now()
       WHERE id = $1`,
      [jobId]
    );
  }

  async markJobCompleted(jobId) {
    await db.query(
      `UPDATE workflow.jobs
       SET status = 'completed', completed_at = now()
       WHERE id = $1`,
      [jobId]
    );
  }

  async markJobFailed(jobId, error) {
    await db.query(
      `UPDATE workflow.jobs
       SET status = 'failed', completed_at = now(), error = $2, retry_count = retry_count + 1
       WHERE id = $1`,
      [jobId, error]
    );
  }

  async processJobs() {
    const jobs = await this.getPendingJobs();

    for (const job of jobs) {
      await this.markJobStarted(job.id);

      try {
        if (job.job_type === 'source_fetch') {
          await sourceEngine.processSource(job.job_data.sourceCode);
        } else if (job.job_type === 'full_workflow') {
          await this.executeFullWorkflow();
        }

        await this.markJobCompleted(job.id);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error.message);
        await this.markJobFailed(job.id, error.message);
      }
    }

    return jobs.length;
  }
}

export const workflowOrchestrator = new WorkflowOrchestrator();
