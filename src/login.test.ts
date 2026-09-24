import assert from "node:assert/strict";
import { loginRequest } from "./game_login.js";

const parsed = loginRequest.safeParse({ phone: "+14155552671", code: "123456" });
assert.equal(parsed.success, true);
assert.equal(loginRequest.safeParse({ phone: "bad", code: "x" }).success, false);
console.log("login request boundary: valid phone/code accepted, malformed input rejected");
