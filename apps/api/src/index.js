import express from 'express';
import cors from 'cors';
import { config } from '@gst-platform/core/config';
import { hsnService } from '@gst-platform/gst-module/hsn';
import { notificationService } from '@gst-platform/gst-module/notifications';
import { stateService } from '@gst-platform/gst-module/states';
import { searchEngine } from '@gst-platform/search-engine';
import { moduleRegistry } from '@gst-platform/registry-engine/modules';
import { sourceRegistry } from '@gst-platform/registry-engine/sources';
import { eventStore } from '@gst-platform/event-engine';
import { apiKeyAuth } from '@gst-platform/billing-engine/auth';
import { usageTracker } from '@gst-platform/billing-engine/usage';

const app = express();

app.use(cors());
app.use(express.json());

// Auth middleware
const authenticate = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required', code: 'NO_API_KEY' });
  }

  const startTime = Date.now();
  const auth = await apiKeyAuth.validateKey(apiKey);

  if (!auth.valid) {
    return res.status(401).json({ error: auth.error, code: 'INVALID_API_KEY' });
  }

  const rateLimit = await apiKeyAuth.checkRateLimit(auth.keyId, auth.customerId, auth.limits);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      code: 'RATE_LIMIT_EXCEEDED',
      limit: rateLimit.limit,
      limit_type: rateLimit.limitType,
      reset_in_seconds: rateLimit.resetIn
    });
  }

  req.auth = auth;
  req.rateLimit = rateLimit;
  req.startTime = startTime;
  
  res.setHeader('X-RateLimit-Limit', rateLimit.limit);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
  
  next();
};

// Track usage after response
const trackUsage = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (req.auth) {
      const responseTime = Date.now() - req.startTime;
      usageTracker.track(
        req.auth.keyId,
        req.auth.customerId,
        req.path,
        req.method,
        res.statusCode,
        responseTime
      ).catch(err => console.error('Usage tracking error:', err));
    }
    originalSend.call(this, data);
  };
  next();
};

app.use(trackUsage);

// Health check (no auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public endpoints (require auth)
app.use('/api/v1', authenticate);

// Search
app.get('/api/v1/search', async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter required' });
    
    const results = await searchEngine.search(q, { limit: parseInt(limit) || 20 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/suggest', async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter required' });
    
    const results = await searchEngine.suggest(q, parseInt(limit) || 10);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HSN endpoints
app.get('/api/v1/hsn/:code', async (req, res) => {
  try {
    const hsn = await hsnService.getByCode(req.params.code);
    if (!hsn) return res.status(404).json({ error: 'HSN not found' });
    res.json(hsn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/hsn/:code/history', async (req, res) => {
  try {
    const history = await hsnService.getHistory(req.params.code);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/hsn', async (req, res) => {
  try {
    const { limit, offset, rate } = req.query;
    
    if (rate) {
      const results = await hsnService.getByRate(parseFloat(rate));
      return res.json(results);
    }
    
    const results = await hsnService.getAllActive(
      parseInt(limit) || 100,
      parseInt(offset) || 0
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/hsn-stats', async (req, res) => {
  try {
    const stats = await hsnService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications
app.get('/api/v1/notifications', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const results = await notificationService.list(
      parseInt(limit) || 50,
      parseInt(offset) || 0
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/notifications/:number', async (req, res) => {
  try {
    const notification = await notificationService.getByNumber(req.params.number);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// States
app.get('/api/v1/states', async (req, res) => {
  try {
    const states = await stateService.list();
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/states/:code/rules', async (req, res) => {
  try {
    const rules = await stateService.getByStateCode(req.params.code);
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Internal endpoints (no auth for admin use)
app.get('/api/v1/modules', async (req, res) => {
  try {
    const modules = await moduleRegistry.list();
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/sources', async (req, res) => {
  try {
    const sources = await sourceRegistry.list();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/events', async (req, res) => {
  try {
    const { limit } = req.query;
    const events = await eventStore.getRecent(parseInt(limit) || 50);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/events/:type', async (req, res) => {
  try {
    const { limit } = req.query;
    const events = await eventStore.getByType(req.params.type, parseInt(limit) || 100);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Intelligence
app.post('/api/v1/intelligence', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });
    
    const results = await searchEngine.search(query, { limit: 5 });
    
    res.json({
      query,
      answer: 'Search results found',
      references: results,
      confidence: 0.8
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.api.port;
const HOST = config.api.host;

app.listen(PORT, HOST, () => {
  console.log(`GST Platform API running on http://${HOST}:${PORT}`);
  console.log('API key authentication enabled');
});
