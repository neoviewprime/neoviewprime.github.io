import assert from 'node:assert/strict';
import { canIncrementViewAfterCooldown, VIEW_COOLDOWN_MS } from './reportEngagementService';

const now = Date.parse('2026-03-14T12:00:00.000Z');

assert.equal(canIncrementViewAfterCooldown(null, now), true);
assert.equal(canIncrementViewAfterCooldown('2026-03-14T10:30:00.000Z', now), false);
assert.equal(canIncrementViewAfterCooldown(new Date(now - VIEW_COOLDOWN_MS), now), true);
assert.equal(canIncrementViewAfterCooldown(new Date(now - VIEW_COOLDOWN_MS - 1), now), true);

console.log('reportEngagementService cooldown tests passed');
