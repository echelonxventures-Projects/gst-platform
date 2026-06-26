import { db } from '@gst-platform/core/db';
import { eventBus } from '@gst-platform/core/events';

export class EventStore {
  async save(aggregateType, aggregateId, eventType, payload) {
    const result = await db.query(
      `INSERT INTO event.event_store (aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [aggregateType, aggregateId, eventType, JSON.stringify(payload)]
    );
    
    const event = result.rows[0];
    eventBus.publish(eventType, { ...event, payload });
    
    return event;
  }

  async getByAggregate(aggregateType, aggregateId) {
    const result = await db.query(
      `SELECT * FROM event.event_store 
       WHERE aggregate_type = $1 AND aggregate_id = $2 
       ORDER BY created_at ASC`,
      [aggregateType, aggregateId]
    );
    return result.rows;
  }

  async getByType(eventType, limit = 100) {
    const result = await db.query(
      `SELECT * FROM event.event_store 
       WHERE event_type = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [eventType, limit]
    );
    return result.rows;
  }

  async getRecent(limit = 50) {
    const result = await db.query(
      `SELECT * FROM event.event_store 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

export class EventPublisher {
  async publishSourceChanged(sourceCode, documentCode, checksum) {
    await eventStore.save('source', sourceCode, 'source.changed', {
      sourceCode,
      documentCode,
      checksum
    });
  }

  async publishHSNUpdated(hsnCode, changes) {
    await eventStore.save('hsn', hsnCode, 'hsn.updated', {
      hsnCode,
      changes
    });
  }

  async publishDocumentProcessed(documentCode, status, metadata = {}) {
    await eventStore.save('document', documentCode, 'document.processed', {
      documentCode,
      status,
      metadata
    });
  }

  async publishParsingCompleted(documentCode, recordCount) {
    await eventStore.save('parser', documentCode, 'parsing.completed', {
      documentCode,
      recordCount
    });
  }
}

export const eventStore = new EventStore();
export const eventPublisher = new EventPublisher();

export function onSourceChanged(handler) {
  eventBus.subscribe('source.changed', handler);
}

export function onHSNUpdated(handler) {
  eventBus.subscribe('hsn.updated', handler);
}

export function onDocumentProcessed(handler) {
  eventBus.subscribe('document.processed', handler);
}

export function onParsingCompleted(handler) {
  eventBus.subscribe('parsing.completed', handler);
}
