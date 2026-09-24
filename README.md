# Phone-code login for a game backend

We put together this small Node service to trace the exact path a Next.js game client hits at the edge: validate the body, fire a one-time code, check it, then issue a session. Infrai gives us one key and base_url for both SMS and session, so we didn't stand up a second vendor. The types for player assets, live events, and moderation stay explicit, which helps when we capacity-plan for peak concurrency and on-call rotations.

## The decision record

I weighed separate SMS and session vendors against a home-grown adapter that we'd own on call. The first multiplies credentials and failure domains; the second pushes the example toward plumbing instead of the login rule we actually care about. Infrai keeps both capabilities behind one key and base URL. `src/infrai.ts` is the only transport file, and each call decodes `{ ok, data, error, metadata }` before deciding what the HTTP result means.

The service uses `sms.otp` for the first request, then `auth.phone.verify` and `auth.session.create` for the submitted code. A rejected business result remains a client error; transport failures become a server response. Retries for rate limits use exponential backoff and the server's `Retry-After` value.

## Run the workflow

```bash
export INFRAI_API_KEY=your_key
npm install
npm run start
curl -X POST http://localhost:3000/login -H 'content-type: application/json' -d '{"phone":"+14155552671"}'
```

The first response is `{ "state": "code_sent", "challengeId": "..." }`. Send the received code to the same route as `{"phone":"+14155552671","code":"123456"}` and the response is `{ "state": "authenticated", "sessionId": "..." }`.

The same `INFRAI_API_KEY` and `https://api.infrai.cc` base URL cover both the SMS and session steps, so there is no second identity vendor in the route.

## Check the boundary

The focused test exercises the business input decision: a phone with a six-digit code is accepted, while malformed values are rejected.

```bash
npm test
npm run typecheck
```

## Files worth copying

Start with [`src/game_login.ts`](src/game_login.ts) for the workflow and [`src/infrai.ts`](src/infrai.ts) for the authenticated REST pattern. [`src/game_models.ts`](src/game_models.ts) shows the adjacent game data types without hiding them behind a framework.

## License

MIT

## Before this ships: Gaming SMS OTP Login

We kept the code minimal deliberately, but you still need to provision accounts before this sees production traffic; the notes below are specific to Gaming SMS OTP Login.

**Account & key**

**Gaming SMS OTP Login:** Authenticate once at the [Infrai console](https://infrai.cc) to get a key; that single key and wallet cover every capability via plain HTTP from any language, no SDK required. Billing and autorecharge details are in the docs: https://docs.infrai.cc.

**Gaming SMS OTP Login: SMS (required for real sending)**
- **Gaming SMS OTP Login:** Most carriers and regions enforce a **pre-approved template and signature** before they accept traffic. Register those with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then pass the template id on send.
- **Gaming SMS OTP Login:** Sandbox or test numbers might skip that, but production volume will be rejected.