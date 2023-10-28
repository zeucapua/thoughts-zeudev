---
title: "Back to Basics: Making a Node.js Web Application"
description: Taking a break from Javascript (meta) frameworks and making a web application and website with Hono and Node.js as the foundation.
date: "2023-10-28"
draft: true
link: https://github.com/zeucapua/robin-tutorial
---

### Why?

For my latest project, I wanted to get away from the bustling modern world of JS (meta) frameworks and return to the basics. Since I just started learning web development over a year ago, I’ve only been learning abstractions based on any given UI framework. But I wanted to know if there is a simpler way to understand and make small web applications?

### What are we building?

Robin is a project time tracker, inspired by Watson CLI tool. A user can create projects and simply clock in and clock out of a session. All sessions are counted to get a total time spent doing projects. The front end will allow for simple CRUD actions to manage the data.

### The Stack

Robin will be a Node.js (Node) web application, built with Hono (https://hono.dev) as our server framework. On top of that, creating a front-end website using `tsx` components with HTMX so I can access the tool anywhere. Deployed on Railway (https://railway.app) alongside a PostgreSQL database. The database is managed and query using Drizzle ORM (https://orm.drizzle.team).

If you want to see the codebase, check out the annotated Github repository and give it a star if you found it useful!

### How does it work?

<image here>

Before writing any code, I think we should take a step back and check how websites work. When someone goes to a URL, the browser makes an HTTP GET request to the index endpoint. Endpoints are how clients, like our browser, can interact and tell the server to do things. In this case, the server starts turning the TSX template we wrote into HTML and returns it back with any Javascript to the browser. The browser then takes the HTML and JS to render the page so the user can look and interact with it.

To put it in other words, we deal with a client making an HTTP request to the server that responds back with data we can parse and use. We can put all of our pages and CRUD actions into server endpoints that we can interact with.

### Before we get started…

For this blog we’ll focus on the Node.js web application and how it’s made and deployed. This will end with a demonstration of the server working by using an `hx-get` (as well as a bonus bash script using charm.sh’  `gum` package). 

For other CRUD actions, like updating and deleting, as well as making a usable front end with HTMX, there will be a part 2 to this blog. But if you want to know more, check out Yusuke Wada (the creator of Hono) and his blog ([https://blog.yusu.ke/hono-htmx-cloudflare/](https://blog.yusu.ke/hono-htmx-cloudflare/)) where he made a to-do list web application with Hono, HTMX, and Cloudflare.

### Installation

Here’s how to get started (using a terminal):

- Create a new folder (`mkdir robin-tutorial` ) and go inside it (`cd robin-tutorial`)
- We’ll start a new Node project by using `pnpm init`, which should generate a `package.json` file.
    - For this tutorial, we will be using `pnpm` , but `npm` should be similar (`pnpm init` = `npm init` , `pnpm add` = `npm install` , etc.)
- From here we have to install our packages, which in our case are:
    - Hono (our server framework): `pnpm add hono @hono/node-server`
    - Dotenv (to access our `.env` variables): `pnpm add dotenv`
    - Drizzle ORM (to manipulate our database): `pnpm add drizzle-orm pg` & `pnpm add -D drizzle-kit @types/pg`
    - TSX (our HTML templates in TS): `pnpm add -D tsx`
- Before moving on, you can look inside the folder to ensure that we have a `node_modules` folder, `package.json` file (which we change in a moment), and a `pnpm-lock.yaml` file (I assume this sets the packages’ version).
- To setup TSX, run `tsc --init` to create a `tsconfig.json` that we will edit to ensure the following properties are not commented. Use a text editor to recreate the following:

```json
{
	"compilerOptions": {
		"target": "es2016",
		"jsx": "react-jsx",
		// some stuff...
		"jsxImportSource": "hono/jsx",

		// some stuff...
		// the following are already set by `tsc --init`, but make sure anyway!
		"module": "commonjs",
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"strict": true,
		"skipLibCheck": true
	}
}
```

- Afterwards, let’s add a new `src` folder with our files inside: `index.tsx` (our app’s entry point), `components.tsx` (our JSX templates), and `schema.ts` (used to model our database with Drizzle).
- Lastly, let’s modify our `package.json` and change our main file and add scripts to run our application, including some for using Drizzle (will be explained later):

```json
{
	// ...
	"main": "src/index.tsx",
	"scripts": {
		"start": "tsx src/index.tsx",
		
		// for drizzle, will be used later
		"generate": "drizzle-kit generate:pg",
		"migrate": "drizzle-kit migrate:pg"
	},
	// ...
}
```

### Did you know Hono means ‘Fire’ in Japanese?

Hono is a Node server framework which makes coding endpoints easy. Other similar frameworks would be Elysia, Fastify, and Express. 

To start our project, start by creating a new `Hono` object and subsequently call functions with the appropriate HTTP request and endpoint. Afterwards export and serve the web app. This will be inside our `index.tsx` file.

```jsx
// index.tsx
// ---------------------------------------

/* Import packages (installed via npm/pnpm) */

// Hono packages
import { Hono } from 'hono';
import { serve } from "@hono/node-server";

// loads environment variables from `.env`, will be used later
import * as dotenv from "dotenv";
dotenv.config();

// ---------------------------------------

/* Configure Hono Web Application */

// initialize web application
const app = new Hono();

/* Route Endpoints */

// GET index page
app.get("/", async (c) => {
	return c.html(
		<h1>Hello world!</h1>
	);
});

export default app;

// ---------------------------------------

/* Deployment */

// use `.env` set PORT, for Railway deployment
const PORT = Number(process.env.PORT) || 3000;

// become a server, to deploy as Node.js app on Railway
serve({
	fetch: app.fetch,
	port: PORT
});
```

Now going back to the terminal, we can run our web application by using the start script from the `package.json` file that we set up earlier: `pnpm run start`. Use the browser and go to `[http://localhost:3000](http://localhost:3000)` and you should be greeted with a big bold “**Hello world!”**

<aside>
💡 If you’re familiar with modern JS (meta) frameworks, making any changes while a development (dev) server is running will cause a re-render, allowing you to see changes in styling, for example. This is because of HMR (Hot Module Reloading). We **don’t** have HMR in this project. So any further changes will require you to stop (`ctrl-c` in the terminal) and restart the dev server (`pnpm run start`).

</aside>

### Implementing the API (feat. Drizzle)

Now that we have the basic web application setup, let’s move our focus onto the database that we’ll use for our time tracking functions. First is setting up our database:

- Provision a new PostgreSQL (postgres) database on Railway by creating a new project.

<image here>

- Once deployed, go to the **Variables** tab on the postgres service and copy the `DATABASE_URL` value…

<image here>

- …which we will add to a new `.env` file in our root directory.

```
# .env
DATABASE_URL=postgresql://<username>:<password>@<location>:<port>/<dbname>
```

Moving on, we now need to define the shape of our data in our `schema.ts` file using Drizzle:

```jsx
// schema.ts
// ---------------------------------------

/* Import packages (installed via npm/pnpm) */
// drizzle-orm packages
import { relations } from "drizzle-orm";
import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

// ---------------------------------------

/* Data Models */
// >> find more information on defining the schema:
// >> https://orm.drizzle.team/docs/sql-schema-declaration
export const projects = pgTable("projects", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).unique()
});

export const sessions = pgTable("sessions", {
	id: serial("id").primaryKey(),
	start: timestamp("start").defaultNow(),
	end: timestamp("end"),
	projectName: varchar("project_name").notNull()
});

/* Relationships Between Models */
// find more information on declaring relations:
// https://orm.drizzle.team/docs/rqb#declaring-relations
export const projects_relations = relations(projects, ({ many }) => ({
	sessions: many(sessions)
}));

export const sessions_relations = relations(sessions, ({ one }) => ({
	project: one(projects, {
		fields: [sessions.projectName],
		references: [projects.name]
	})
})); 

// ---------------------------------------
```

This schema will create a one-to-many relationship where a **project** can have multiple **sessions**. Visually it’ll be diagrammed like so, thanks to DiagramGPT ([https://www.eraser.io/diagramgpt](https://www.eraser.io/diagramgpt)):

<image here>
