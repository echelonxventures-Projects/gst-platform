import { workflowOrchestrator } from '@gst-platform/workflow-engine';

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 60000; // 1 minute

async function processJobs() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for pending jobs...`);
    
    const processed = await workflowOrchestrator.processJobs();
    
    if (processed > 0) {
      console.log(`Processed ${processed} jobs`);
    }
  } catch (error) {
    console.error('Error processing jobs:', error.message);
  }
}

async function runScheduledWorkflow() {
  try {
    console.log(`[${new Date().toISOString()}] Running scheduled workflow...`);
    
    await workflowOrchestrator.executeFullWorkflow();
    
    console.log('Workflow completed');
  } catch (error) {
    console.error('Error running workflow:', error.message);
  }
}

async function start() {
  console.log('GST Platform Worker started');
  console.log(`Poll interval: ${POLL_INTERVAL}ms`);

  // Run immediately on startup
  await runScheduledWorkflow();

  // Then poll for jobs
  setInterval(processJobs, POLL_INTERVAL);

  // Run full workflow daily at 2 AM
  const now = new Date();
  const scheduledTime = new Date(now);
  scheduledTime.setHours(2, 0, 0, 0);
  
  if (scheduledTime < now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const msUntilScheduled = scheduledTime - now;
  
  setTimeout(() => {
    runScheduledWorkflow();
    setInterval(runScheduledWorkflow, 24 * 60 * 60 * 1000); // Daily
  }, msUntilScheduled);

  console.log(`Next scheduled workflow: ${scheduledTime.toISOString()}`);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Worker shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Worker shutting down...');
  process.exit(0);
});

start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
