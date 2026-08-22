const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

export function getSavedGroupTokens() {
  try {
    const saved = localStorage.getItem('splitit_groups')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function saveGroupToken(ownerToken) {
  if (!ownerToken) return
  const tokens = getSavedGroupTokens()
  if (!tokens.includes(ownerToken)) {
    tokens.push(ownerToken)
    localStorage.setItem('splitit_groups', JSON.stringify(tokens))
  }
}

export function removeSavedGroupToken(ownerToken) {
  const tokens = getSavedGroupTokens().filter(token => token !== ownerToken)
  localStorage.setItem('splitit_groups', JSON.stringify(tokens))
}

export async function getAllSavedGroups() {
  const tokens = getSavedGroupTokens()
  const groupPromises = tokens.map(token => 
    getGroupByOwner(token).catch(() => null)
  )
  const results = await Promise.all(groupPromises)
  return results.filter(Boolean)
}

export const createGroup = (name, tip_percentage) =>
  request('/groups/', { method: 'POST', body: JSON.stringify({ name, tip_percentage }) })

export const getGroupByOwner = (ownerToken) =>
  request(`/groups/owner/${ownerToken}`)

export const getGroupByJoinToken = (joinToken) =>
  request(`/groups/join/${joinToken}`)

export const updateTip = (ownerToken, tip_percentage) =>
  request(`/groups/owner/${ownerToken}/tip?tip_percentage=${tip_percentage}`, { method: 'PATCH' })

export const closeGroup = (ownerToken) =>
  request(`/groups/owner/${ownerToken}/close`, { method: 'PATCH' })

export const getSummary = (ownerToken) =>
  request(`/groups/owner/${ownerToken}/summary`)


export const addMember = (ownerToken, name, revolutLink = '') =>
  request(`/members/?owner_token=${ownerToken}`, { method: 'POST', body: JSON.stringify({ name, revolut_link: revolutLink.trim() }) })

export const getMemberByToken = (joinToken) =>
  request(`/members/join/${joinToken}`)


export const addMenuItem = (ownerToken, name, price) =>
  request(`/menu-items/?owner_token=${ownerToken}`, {
    method: 'POST',
    body: JSON.stringify({ name, price: parseFloat(price) }),
  })

export const deleteMenuItem = (itemId, ownerToken) =>
  request(`/menu-items/${itemId}?owner_token=${ownerToken}`, { method: 'DELETE' })


export const upsertSelection = (joinToken, menu_item_id, quantity) =>
  request(`/selections/?join_token=${joinToken}`, {
    method: 'POST',
    body: JSON.stringify({ menu_item_id, quantity }),
  })

export const getMySelections = (joinToken) =>
  request(`/selections/member/${joinToken}`)
