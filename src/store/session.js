export function saveSession (loginResult) {
  const user = loginResult.user || loginResult.profile || loginResult
  if (loginResult.token) {
    localStorage.setItem('undercover-token', loginResult.token)
  }
  localStorage.setItem('undercover-auth', 'yes')
  localStorage.setItem('undercover-current-user', user.nickname || user.username || '道友')
  localStorage.setItem('undercover-user-profile', JSON.stringify(user))
  return user
}

export function getSessionUser () {
  const saved = localStorage.getItem('undercover-user-profile')
  return saved ? JSON.parse(saved) : null
}

export function clearSession () {
  localStorage.removeItem('undercover-auth')
  localStorage.removeItem('undercover-token')
  localStorage.removeItem('undercover-user-profile')
  localStorage.removeItem('undercover-current-user')
  localStorage.removeItem('undercover-room-code')
  localStorage.removeItem('undercover-agent-session-id')
  localStorage.removeItem('undercover-game')
}
