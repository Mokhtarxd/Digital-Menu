# Dar Lmeknessiya - Digital Menu System

## Project info

**URL**: https://lovable.dev/projects/58978195-5c30-48e6-8d4c-38657b9a8039

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/58978195-5c30-48e6-8d4c-38657b9a8039) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Integrations

- [Google Sheets Export](docs/google-sheets-export.md) — append every order or cancellation to a Google Sheet via a free Google Apps Script web app.

## Customization

### Opening hours banner

Edit the banner directly from the admin dashboard (**Overview → Opening hours**) or fall back to the `VITE_OPENING_HOURS` environment variable.

- Provide a simple string to display a single line (e.g. `Monday – Sunday · 12:00 – 23:00`).
- Separate multiple lines with `|` (e.g. `Lunch 12:00 – 15:30|Dinner 19:00 – 23:30`).
- For multilingual hours, pass JSON, for example:

	```json
	{
		"en": ["Monday – Sunday · 12:00 – 23:00"],
		"fr": ["Lundi – Dimanche · 12h00 – 23h00"],
		"ar": ["يوميًا · 12:00 – 23:00"]
	}
	```

When using the env variable method, restart the dev server so Vite can pick up the new value.

Refer to [docs/opening-hours.md](docs/opening-hours.md) for advanced formatting tips.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/58978195-5c30-48e6-8d4c-38657b9a8039) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
