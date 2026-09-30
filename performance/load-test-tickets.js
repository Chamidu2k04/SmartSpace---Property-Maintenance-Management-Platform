import http from 'k6/http';
import { check, sleep } from 'k6';

// ✅ All configurable via environment variables
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5030';
const UNIT_ID = __ENV.UNIT_ID || 'bbbbbbbb-2222-2222-2222-222222222222';
const TEST_TOKEN = __ENV.TEST_TOKEN;

// Fail fast on misconfiguration for easier CI diagnosis
if (!TEST_TOKEN) {
  throw new Error(
    'TEST_TOKEN is required. Run with: k6 run --env TEST_TOKEN=<token> ' +
    'performance/load-test-tickets.js'
  );
}

if (typeof BASE_URL !== 'string' || BASE_URL.trim() === '') {
  throw new Error('BASE_URL must be a non-empty string.');
}

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '20s', target: 20 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(90)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const data = {
    UnitId: UNIT_ID,
    Description: `[LOADTEST] issue ${__VU}-${__ITER}`,
    UrgencyLevel: 'Medium',
  };

  const params = {
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/tickets`, data, params);

  if (res.status !== 201) {
    console.log(`Status: ${res.status} | Body: ${res.body}`);
  }

  check(res, {
    'status is 201': (r) => r.status === 201,
  });

  sleep(1);
}
