# ayyo-app

[![Node.js CI](https://github.com/iathul/ayyo-app/actions/workflows/node.js.yml/badge.svg)](https://github.com/iathul/ayyo-app/actions/workflows/node.js.yml)

Ayyo (pronounced like "I/O", as in Input/Output) is a backend service for sending files via shareable links — similar in spirit to WeTransfer. Users sign up, upload one or more files, and get back a link that lets anyone download the package until it expires.

## Tech stack

- **Runtime**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Storage**: AWS S3 (file uploads/downloads via `multer-s3`)
- **Auth**: JWT access/refresh tokens, email verification, password reset
- **Background jobs**: Bull (Redis-backed queue) for sending emails, `node-schedule` for periodic cleanup of expired packages
- **Email**: Nodemailer (Gmail transport) with EJS templates
- **Testing**: Jest + Supertest, with `mongodb-memory-server` for a real (in-memory) MongoDB in tests

## Architecture

```text
app.js          Express app: middleware, routes (no side effects on require)
bin/start.js    Entrypoint: loads env, connects to MongoDB, starts background jobs, starts the HTTP server
routes/         Route definitions + request validation chains
controllers/    Request handlers (auth, user, file)
models/         Mongoose schemas (User, Package)
middlewares/    JWT verification + auth guard
jobs/           Background workers: queued emails, expired-package cleanup
emails/         Email-sending helpers (renders EJS templates, queues via Bull)
config/         DB, S3, multer, Bull, Nodemailer setup
```

**Auth flow**: register → verification email sent → user clicks link to verify → login issues a short-lived access token and a longer-lived refresh token → protected routes are guarded by `middlewares/auth.js`, which verifies the JWT and loads the user from the database.

**File flow**: an authenticated user uploads one or more files, which are streamed directly to S3 and grouped into a `Package` document with an expiry date. A sharable link is generated from the package ID. Anyone with the link can download the package (no auth required) until it expires; multi-file packages are zipped on the fly. A scheduled job periodically deletes expired packages from S3 and the database.

## Getting started

### Prerequisites

- Node.js (see [.nvmrc](.nvmrc) for the version used in development)
- A running MongoDB instance
- A running Redis instance (used by Bull for the email queue)
- An AWS S3 bucket + credentials
- A Gmail account (or adapt `config/nodemailer.js` for another provider) for sending verification/reset emails

### Setup

```bash
git clone https://github.com/iathul/ayyo-app.git
cd ayyo-app
npm install
cp .env.sample .env
```

Fill in `.env` — see the comments in [.env.sample](.env.sample) for what each variable is for. At minimum you'll need MongoDB and JWT secrets to run the app; S3, Redis, and email credentials are needed for uploads/downloads and email flows respectively.

### Run

```bash
npm run dev    # development, with request logging and auto-reload
npm start      # plain start
npm run prod   # production mode
```

The server listens on `PORT` from your `.env` (defaults to `5000`).

### Test

```bash
npm test
```

Tests run against an in-memory MongoDB (no real database needed) with S3, the email queue, and Nodemailer mocked out — no AWS, Redis, or Gmail credentials required to run the suite.

### Lint

```bash
npm run lint
```

## API reference

All routes are mounted under `/api/v1`.

| Method | Path                              | Auth   | Description                                     |
|--------|-----------------------------------|--------|-------------------------------------------------|
| POST   | `/auth/register`                  | –      | Create an account, sends a verification email   |
| GET    | `/auth/verify/email?token=`       | –      | Verify an account via the emailed token         |
| POST   | `/auth/verify/email`              | –      | Resend the verification email                   |
| POST   | `/auth/login`                     | –      | Log in, returns access + refresh tokens         |
| POST   | `/auth/refresh-token`             | –      | Exchange a refresh token for a new access token |
| POST   | `/auth/password`                  | –      | Request a password reset email                  |
| PUT    | `/auth/password?token=`           | –      | Set a new password using the emailed token      |
| GET    | `/users`                          | Bearer | Get the current user's details                  |
| PUT    | `/users`                          | Bearer | Update first/last name                          |
| DELETE | `/users`                          | Bearer | Delete the current account                      |
| PUT    | `/users/avatar`                   | Bearer | Upload/replace the user's avatar                |
| POST   | `/files`                          | Bearer | Upload one or more files, creates a package     |
| GET    | `/files/sharable-link/:packageId` | Bearer | Get the public download URL for a package       |
| GET    | `/files/download/:packageId`      | –      | Download a package (single file or zipped)      |

Auth endpoints and the public download endpoint are rate-limited.

## Known limitations

- No live demo is hosted — this is designed for self-hosting (see Setup above).
- No frontend; this is an API-only backend. Use the table above with `curl`/Postman/Insomnia to try it out.
- File uploads are streamed to S3 directly; there's no local-storage-only mode for production use (avatars do use local disk storage, see `config/multer.js`).

## License

[MIT](LICENSE)
