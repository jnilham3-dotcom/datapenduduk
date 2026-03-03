
/**
 * Mock for node-fetch and formdata-polyfill to prevent assignment to window.fetch
 * which is read-only in some environments.
 */
const _fetch = typeof window !== 'undefined' ? window.fetch : (typeof globalThis !== 'undefined' ? globalThis.fetch : null);
const _Request = typeof window !== 'undefined' ? window.Request : (typeof globalThis !== 'undefined' ? globalThis.Request : null);
const _Response = typeof window !== 'undefined' ? window.Response : (typeof globalThis !== 'undefined' ? globalThis.Response : null);
const _Headers = typeof window !== 'undefined' ? window.Headers : (typeof globalThis !== 'undefined' ? globalThis.Headers : null);
const _FormData = typeof window !== 'undefined' ? window.FormData : (typeof globalThis !== 'undefined' ? globalThis.FormData : null);

export { 
  _fetch as fetch, 
  _Request as Request, 
  _Response as Response, 
  _Headers as Headers,
  _FormData as FormData
};
export default _fetch;
