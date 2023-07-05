# ayyo-app

[![Node.js CI](https://github.com/iathul/ayyo-app/actions/workflows/node.js.yml/badge.svg)](https://github.com/iathul/ayyo-app/actions/workflows/node.js.yml)


ayyo server side development

## What is Ayyo?

Ayyo (Pronounced as I/O simply means Input and Output) is an application for transferring file via email.

### To run Ayyo

Clone the project  **ayyo-server**

Move to ayyo-server directory.

```text
cd ayyo-server

```

Install dependencies

```text
npm install

```

Setup environment variables

- `cp .env.sample .env`, and modify as required

Run ayyo in production mode

```text
npm start

```

Run ayyo in development mode

```text
npm run dev

```

ayyo will be running in developing mode at

```text
localhost: PORT

```

Fix any lint error

```text
npm run lint

```
