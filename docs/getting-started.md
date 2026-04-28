# Getting Started

This walks you from a fresh install to running your first command.

## 1. Install

```bash
npm install -g ccam
```

Check it's on your path:

```bash
ccam --version
```

## 2. Get an Account Manager API client

ccam talks to the Account Manager REST API over OAuth2. Before you can log in, you need an AM API client (a "client ID") with access to your org. This is the same prerequisite sfcc-ci and every other AM tool has -- AM doesn't issue tokens to anonymous callers.

If you already have an API client you use for other Commerce Cloud tooling (e.g. sfcc-ci, deployment pipelines), you can reuse it. Skip to step 3.

If you don't:

1. Go to [Account Manager](https://account.demandware.com) and sign in.
2. Open **API Client** (top nav). Creating an API client requires the *Account Administrator* or *API Administrator* role.
3. Click **Add API Client**. Give it a display name (e.g. `ccam-<your-name>`) and set a client secret -- save this secret somewhere safe, AM will not show it again.
4. Under **Roles**, assign the roles that correspond to the operations you want to perform. For read-only audits, `readonly-account-admin` on the relevant organization is usually enough. For write operations (`user update`, `client create`, etc.), you'll need the corresponding write roles -- see [`docs/role-capabilities.md`](role-capabilities.md).
5. Under **Default Scopes**, set: `mail roles tenantFilter profile openId`
6. Under **Token Endpoint Auth Method**, choose `client_secret_post` (required for the password and authorization_code grants).
7. **For browser login only:** Under **Redirect URIs**, add `http://127.0.0.1:65535/callback`. ccam's browser flow runs a loopback server on port 65535 by default; override with `--redirect-port <port>` at login time if you need a different port (then register a matching redirect URI).

Save the client.

## 3. Log in

Pick the flow that fits your situation.

### Browser (recommended for human users)

```bash
ccam auth login --client-id <your-client-id>
```

You'll be prompted for the client secret, then a browser opens to AM. Approve the app; you'll be redirected back to ccam and a profile is saved to `~/.config/ccam/`.

If you're on a headless machine (SSH, container), add `--manual`:

```bash
ccam auth login --manual --client-id <your-client-id>
```

ccam prints the authorize URL; you open it in a browser, approve, and paste the redirect URL back.

### Client credentials (recommended for CI and automation)

```bash
ccam auth login --client --client-id <your-client-id> --client-secret <your-secret>
```

No user context; only operations the client itself is authorized for will succeed.

### Password (ROPC)

Works when your AM tenant doesn't enforce SSO or MFA on the API client:

```bash
ccam auth login --password \
  --client-id <your-client-id> \
  --client-secret <your-secret> \
  --user <you@example.com> \
  --user-password <your-password>
```

## 4. Verify

```bash
ccam auth status
```

Expected output:

```
Profile: default
Source: profile
Host: https://account.demandware.com
Client ID: <your-client-id>

Status: Valid
```

## 5. Run your first command

List roles available to your client:

```bash
ccam role list
```

Export users in an org as a CSV roster:

```bash
ccam user list --org <org-id> --format csv > users.csv
```

Browse AM interactively:

```bash
ccam
```

## Common issues

**`AM rejected the login as a confidential client`**
You ran the browser flow without a client secret, but AM expected one. Rerun without `--public`, and enter the secret when prompted. Only use `--public` if your API client was created as a public (no-secret) client.

**`redirect_uri_mismatch` in the browser**
The redirect URI registered on the AM API client doesn't match what ccam sent. Check that `http://127.0.0.1:65535/callback` (or your `--redirect-port` override) is in the **Redirect URIs** list on the API client.

**`invalid_grant` on `--password` login**
The user account requires SSO or MFA, which ROPC (password grant) cannot satisfy. Use the browser flow instead.

**`403 Forbidden` on commands that used to work**
The API client is missing the role required for that operation. See [`docs/role-capabilities.md`](role-capabilities.md) for which roles gate which commands.

## Multiple profiles

```bash
ccam auth login --profile prod --client-id <prod-id>
ccam auth login --profile staging --client-id <staging-id>
ccam auth use staging            # set active
ccam user list --profile prod    # one-off override
ccam auth list                   # see all
```
