<h1 align="center" id="title">Digital Uzbekistan</h1>

<p align="center"><img src="https://www.portfolio.digitaluzbekistan.com/images/startup.png" alt="project-image"></p>

<p id="description">This project is a real startup. You can see admin instructor and user professional dashboards in the project. In order for the project to be at the international level we have made it in 4 languages English Uzbek Turkish and Russian.</p>

<h2>🚀 Demo</h2>

[https://digitaluzbekistan.com/](https://digitaluzbekistan.com/)

  
  
<h2>🧐 Features</h2>

Here're some of the project's best features:

*   Designed database architecture and integrated external services for authentication and content management.
*   Implemented a secure auth system with access and refresh tokens supporting multiple user roles (admin instructor and learner).
*   Built server-side rendered (SSR) frontend for better SEO and performance.
*   Created separate dashboards for users instructors and administrators to manage courses and platform data.
*   Integrated RESTful APIs between frontend and backend ensuring smooth communication and scalability.
*   Deployed a working production version enabling users to register watch courses and create new ones.
*   Gained practical understanding of full-stack development flow from database design to Ul implementation.

  
  
<h2>💻 Built with</h2>

Technologies used in the project:

*   Typescript
*   NextJS
*   NestJS
*   Chakra-ui

<h2>Run project</h1>

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

<h2>.env file requires</h2>

MONGODB_URI
SECRET_JWT
SEND_GRID_KEY
PORT = 8000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<youremail@gmail.com>
SMTP_PASS=
SMTP_FROM=<Your Name> <youremail@gmail.com>

STRIPE_SECRET_KEY

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
