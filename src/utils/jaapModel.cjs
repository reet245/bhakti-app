function sanitizeSession(value) {
  return {
    count: Number.isInteger(value?.count) ? Math.max(0, Math.min(value.count, 99999)) : 0,
    elapsedMs: Number.isFinite(value?.elapsedMs) ? Math.max(0, value.elapsedMs) : 0,
    // A saved session always resumes paused, including after an app crash.
    runningSince: null,
  };
}

function activeElapsedMs(session, now = Date.now()) {
  return session.elapsedMs + (session.runningSince == null ? 0 : Math.max(0, now - session.runningSince));
}

function pauseSession(session, now = Date.now()) {
  return { ...session, elapsedMs: activeElapsedMs(session, now), runningSince: null };
}

module.exports = { sanitizeSession, activeElapsedMs, pauseSession };
