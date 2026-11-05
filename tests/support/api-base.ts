// Isolate browser acceptance from an already-running user backend.
export const TEST_API_BASE = `http://127.0.0.1:${process.env.DM_TEST_API_PORT || '8000'}`;
