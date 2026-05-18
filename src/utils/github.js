// GitHub REST API helper
// All data lives in a separate private repo (bheem-data)

const BASE = 'https://api.github.com'

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
})

/**
 * Encode a JS object to base64 JSON that is 100% ASCII-safe.
 * Every non-ASCII char (emoji, accented letters, etc.) becomes \uXXXX,
 * so btoa() never chokes, and JSON.parse restores them perfectly on any reader.
 */
function toBase64Json(obj) {
  const json = JSON.stringify(obj, null, 2)
    .replace(/[\u0080-\uFFFF]/g, c =>
      `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`
    )
  return btoa(json)
}

/** Decode base64 JSON from GitHub — handles both ASCII-escaped and raw UTF-8 variants. */
function fromBase64Json(b64) {
  const raw = atob(b64.replace(/\n/g, ''))
  // If any byte is > 127 the content is raw UTF-8 (old btoa+encodeURIComponent format).
  // We must run TextDecoder BEFORE JSON.parse — garbled UTF-8 is still valid JSON
  // so try/catch never helps here; only the byte-level check works.
  const hasHighBytes = raw.split('').some(c => c.charCodeAt(0) > 127)
  if (hasHighBytes) {
    const bytes = Uint8Array.from(raw, c => c.charCodeAt(0))
    return JSON.parse(new TextDecoder('utf-8').decode(bytes))
  }
  return JSON.parse(raw)
}

// ── File ops ────────────────────────────────────────────────────────────────

export async function getFile(token, owner, repo, path) {
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    headers: headers(token),
  })
  if (res.status === 404) return { content: null, sha: null }
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`)
  const data = await res.json()
  const content = fromBase64Json(data.content)
  return { content, sha: data.sha }
}

export async function putFile(token, owner, repo, path, content, sha, message) {
  const body = {
    message,
    content: toBase64Json(content),
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GitHub PUT ${path}: ${res.status}`)
  const data = await res.json()
  return data.content.sha
}

// Store image as raw base64 string (not JSON-wrapped)
export async function putImage(token, owner, repo, path, base64Data, sha, message) {
  const body = { message, content: base64Data, ...(sha ? { sha } : {}) }
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GitHub PUT image ${path}: ${res.status}`)
  const data = await res.json()
  return { sha: data.content.sha, downloadUrl: data.content.download_url }
}

export async function getImageUrl(token, owner, repo, path) {
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    headers: headers(token),
  })
  if (res.status === 404) return null
  if (!res.ok) return null
  const data = await res.json()
  // download_url requires auth for private repos — can't use in <img src>.
  // Return a data: URL from the base64 content instead.
  const b64 = data.content.replace(/\n/g, '')
  return `data:image/jpeg;base64,${b64}`
}

// ── Repo creation ────────────────────────────────────────────────────────────

export async function createRepo(token, name) {
  const res = await fetch(`${BASE}/user/repos`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ name, private: true, description: "Bheem's tracker data 🐾", auto_init: true }),
  })
  if (!res.ok && res.status !== 422) throw new Error(`Create repo failed: ${res.status}`)
}

export async function repoExists(token, owner, repo) {
  const res = await fetch(`${BASE}/repos/${owner}/${repo}`, { headers: headers(token) })
  return res.ok
}

// ── Authenticat──────────────────────────────────────────────────────

export async function getAuthUser(token) {
  const res = await fetch(`${BASE}/user`, { headers: headers(token) })
  if (!res.ok) throw new Error('Invalid token or network error')
  return res.json()
}
