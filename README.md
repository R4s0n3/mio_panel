# Mio Mideal Panel

Simple backend panel for Mio Mideal websites.

## Deployment

For Coolify/Docker deployments behind a reverse proxy, keep Docker bound to
`0.0.0.0:3000`, but set Auth.js to the public URL:

```env
AUTH_URL=https://panel.miomideal.com
AUTH_TRUST_HOST=true
```

`AUTH_URL` must include the protocol. `panel.miomideal.com` by itself is not a
valid URL and will make Auth.js throw `TypeError: Invalid URL`.

The Discord OAuth redirect URL should be:

```text
https://panel.miomideal.com/api/auth/callback/discord
```
