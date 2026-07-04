import assert from "node:assert/strict";
import { mergeMetricValue } from "./reportIntegrityService";

assert.equal(mergeMetricValue(undefined, null, 0), 0);
assert.equal(mergeMetricValue(3, 1, 2), 3);
assert.equal(mergeMetricValue(4, 8, 2), 8);
assert.equal(mergeMetricValue(-10, 6, 5), 6);

console.log("reportIntegrityService metric merge tests passed");
