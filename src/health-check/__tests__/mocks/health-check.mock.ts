export const mockHealthCheckResponseOK = {
  uptime: 12345,
  message: 'OK',
  timestamp: Date.now(),
  checks: [
    { name: 'Database', type: 'internal', status: true, details: 'Connected' },
    { name: 'Redis', type: 'internal', status: true, details: 'Connected' },
  ],
};

export const mockHealthCheckResponseError = {
  uptime: 12345,
  message: 'ERROR',
  timestamp: Date.now(),
  checks: [
    {
      name: 'Database',
      type: 'internal',
      status: false,
      details: 'Failed to connect',
    },
    { name: 'Redis', type: 'internal', status: true, details: 'Connected' },
  ],
};
