# Autonomous DeFi Agents - API Documentation

## 🚀 Server Information

**Base URL**: `http://localhost:3001`
**Framework**: Express.js + TypeScript
**Architecture**: REST API with async job processing

---

## 📚 Endpoints

### 1. **POST /api/analyze**

Start a new portfolio analysis workflow.

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4"
}
```

**Response** (202 Accepted):
```json
{
  "jobId": "job_1708033200000_abc123xyz",
  "status": "pending",
  "message": "Portfolio analysis started. Use the jobId to check status.",
  "statusUrl": "/api/status/job_1708033200000_abc123xyz"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid or missing wallet address
- `500 Internal Server Error`: Server error

**Example (curl)**:
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4"}'
```

---

###2. **GET /api/status/:jobId**

Check the status of an analysis job.

**URL Parameters**:
- `jobId`: Job ID returned from `/api/analyze`

**Response** (200 OK):
```json
{
  "jobId": "job_1708033200000_abc123xyz",
  "status": "analyzing",  // pending | analyzing | complete | error
  "currentAgent": "Market Analyzer",
  "progress": 0.4,  // 0-1 (40% complete)
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
  "result": null,  // null until complete
  "error": null,   // null unless error
  "createdAt": "2026-02-16T23:30:00.000Z",
  "completedAt": null  // null until complete
}
```

**When Complete**:
```json
{
  "jobId": "job_1708033200000_abc123xyz",
  "status": "complete",
  "currentAgent": null,
  "progress": 1.0,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
  "result": {
    "action": "swap",
    "details": {
      "fromToken": "ETH",
      "toToken": "USDC",
      "amount": 0.0163
    },
    "expectedAPY": 0,
    "maxRisk": 0,
    "confidence": 0.6,
    "explanation": "Market analysis indicates bearish trend..."
  },
  "error": null,
  "createdAt": "2026-02-16T23:30:00.000Z",
  "completedAt": "2026-02-16T23:31:15.000Z",
  "workflowState": { ... }  // Full workflow state
}
```

**Error Responses**:
- `404 Not Found`: Job ID not found
- `500 Internal Server Error`: Server error

**Example (curl)**:
```bash
curl http://localhost:3001/api/status/job_1708033200000_abc123xyz
```

---

### 3. **GET /api/portfolio/:walletAddress**

Get quick portfolio snapshot (no full analysis).

**URL Parameters**:
- `walletAddress`: Ethereum wallet address

**Response** (200 OK):
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
  "totalValue": 107.19,
  "holdings": {
    "ETH": {
      "balance": 0.0545,
      "priceUSD": 1966.74,
      "valueUSD": 107.19
    },
    "USDC": {
      "balance": 0,
      "priceUSD": 1.00,
      "valueUSD": 0
    }
  },
  "timestamp": "2026-02-16T23:30:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid wallet address
- `500 Internal Server Error`: Server error

**Example (curl)**:
```bash
curl http://localhost:3001/api/portfolio/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4
```

---

### 4. **GET /api/jobs**

List all active jobs (useful for debugging).

**Response** (200 OK):
```json
{
  "total": 3,
  "jobs": [
    {
      "jobId": "job_1708033200000_abc123xyz",
      "status": "complete",
      "walletAddress": "0x742d...",
      "progress": 1.0,
      "createdAt": "2026-02-16T23:30:00.000Z",
      "completedAt": "2026-02-16T23:31:15.000Z"
    },
    ...
  ]
}
```

**Example (curl)**:
```bash
curl http://localhost:3001/api/jobs
```

---

### 5. **DELETE /api/jobs/:jobId**

Delete a job from memory.

**URL Parameters**:
- `jobId`: Job ID to delete

**Response** (200 OK):
```json
{
  "message": "Job deleted successfully",
  "jobId": "job_1708033200000_abc123xyz"
}
```

**Error Responses**:
- `404 Not Found`: Job ID not found

**Example (curl)**:
```bash
curl -X DELETE http://localhost:3001/api/jobs/job_1708033200000_abc123xyz
```

---

### 6. **GET /health**

Health check endpoint.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T23:30:00.000Z",
  "uptime": 3600.5,
  "activeJobs": 2,
  "environment": {
    "nodeEnv": "development",
    "port": 3001
  }
}
```

**Example (curl)**:
```bash
curl http://localhost:3001/health
```

---

### 7. **GET /**

Root endpoint - API information.

**Response** (200 OK):
```json
{
  "name": "Autonomous DeFi Agents API",
  "version": "1.0.0",
  "description": "AI-powered DeFi portfolio management and rebalancing recommendations",
  "endpoints": {
    "POST /api/analyze": "Start portfolio analysis",
    "GET /api/status/:jobId": "Check analysis status",
    "GET /api/portfolio/:address": "Get portfolio snapshot",
    "GET /api/jobs": "List all jobs",
    "DELETE /api/jobs/:jobId": "Delete a job",
    "GET /health": "Health check"
  },
  "documentation": "See README.md for usage examples"
}
```

**Example (curl)**:
```bash
curl http://localhost:3001/
```

---

## 🔄 Workflow Sequence

### Typical User Flow:

1. **Start Analysis**:
   ```bash
   POST /api/analyze → Returns jobId
   ```

2. **Poll for Status** (every 2-3 seconds):
   ```bash
   GET /api/status/:jobId → Check progress
   ```

3. **Get Final Result**:
   ```bash
   GET /api/status/:jobId → status: "complete", result: {...}
   ```

4. **Optional: Quick Balance Check**:
   ```bash
   GET /api/portfolio/:address → Instant snapshot
   ```

---

## ⏱️ Timing & Performance

| Endpoint | Expected Response Time |
|----------|------------------------|
| `POST /api/analyze` | < 100ms (returns immediately) |
| `GET /api/status/:jobId` | < 50ms (in-memory lookup) |
| `GET /api/portfolio/:address` | 2-5 seconds (blockchain + API calls) |
| `GET /api/jobs` | < 10ms |
| `DELETE /api/jobs/:jobId` | < 10ms |
| `GET /health` | < 10ms |

**Full Workflow Duration**: 45-90 seconds (all 5 agents)

---

## 🛡️ Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common Error Codes**:
- `400`: Invalid request (bad wallet address, missing fields)
- `404`: Resource not found (job ID not found)
- `500`: Internal server error (workflow failure, API issues)

---

## 🔧 Configuration

**Environment Variables**:
```env
PORT=3001
GOOGLE_API_KEY=...
SEPOLIA_RPC_URL=...
COINGECKO_API_KEY=...
THE_GRAPH_API_KEY=...
```

**Defaults**:
- Workflow timeout: 2 minutes
- Job retention: 30 minutes
- Auto-cleanup: Every 10 minutes

---

## 📊 Job Status Flow

```
pending → analyzing → complete
           ↓
         error
```

**Status Descriptions**:
- `pending`: Job created, workflow not started yet
- `analyzing`: Workflow running, agents executing
- `complete`: Workflow finished, recommendation available
- `error`: Workflow failed, error message available

---

## 🎯 Example Usage Scenarios

### Scenario 1: Simple Analysis

```bash
# Start analysis
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4"}'

# Response: {"jobId": "job_abc123", "status": "pending", ...}

# Check status (poll every 3 seconds)
curl http://localhost:3001/api/status/job_abc123

# When complete: status: "complete", result: {...}
```

### Scenario 2: Quick Balance Check

```bash
# Get instant portfolio snapshot
curl http://localhost:3001/api/portfolio/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4

# Response: {"totalValue": 107.19, "holdings": {...}}
```

### Scenario 3: Monitor Multiple Jobs

```bash
# List all jobs
curl http://localhost:3001/api/jobs

# Response: {"total": 3, "jobs": [...]}
```

---

## 🚀 Testing the API

### Start Server:
```bash
cd agents
npm run dev
```

### Test Endpoints:
```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/

# Start analysis
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4"}'
```

---

## 📝 Notes

- **In-memory storage**: Jobs are stored in memory (cleared on server restart)
- **No authentication**: MVP version has no auth (add for production)
- **CORS enabled**: Frontend can call from any origin
- **Async processing**: Analysis runs in background, doesn't block API
- **Auto-cleanup**: Old jobs deleted after 30 minutes

---

## 🎊 Ready for Frontend Integration!

This API is designed to be consumed by a React/Next.js frontend with polling or WebSocket integration.
