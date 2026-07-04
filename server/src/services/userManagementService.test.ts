import assert from "node:assert/strict";
import { deriveAccessProfileRole, isApprovalJobTitle } from "./userManagementService";

assert.equal(isApprovalJobTitle("Gestor"), true);
assert.equal(isApprovalJobTitle("Gerente"), true);
assert.equal(isApprovalJobTitle("Superintendente"), true);
assert.equal(isApprovalJobTitle("Diretor"), true);
assert.equal(isApprovalJobTitle("Supervisor"), false);
assert.equal(isApprovalJobTitle("Analista"), false);

assert.equal(deriveAccessProfileRole("Gestor"), "supervisor");
assert.equal(deriveAccessProfileRole("Diretor"), "supervisor");
assert.equal(deriveAccessProfileRole("Analista"), "analyst");
assert.equal(deriveAccessProfileRole("Estagiario"), "analyst");

console.log("userManagementService tests passed");
