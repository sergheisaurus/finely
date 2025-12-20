# GEMINI.md

This file provides a summary of the project and instructions on how to set it up and run it.

## Project Overview

This is a Laravel 12 project that uses Inertia.js and React for the frontend. It also uses Fortify for authentication and Tailwind CSS for styling. The frontend is built with Vite.

## Building and Running

To get started with the project, run the following commands:

```bash
composer run setup
composer run dev
```

The `composer run setup` command will install all the dependencies, create a `.env` file, generate an application key, and run the database migrations.

The `composer run dev` command will start the development server, which includes the PHP server, the queue listener, a log watcher, and the Vite development server.

## Development Conventions

### Backend

The backend follows the standard Laravel conventions.

### Frontend

The frontend is built with React and TypeScript. The files are located in the `resources/js` directory. The project uses ESLint and Prettier for code formatting and linting.

### Testing

The project uses Pest for testing. You can run the tests with the following command:

```bash
composer run test
```

## Tools

### Backend

*   **[Laravel](https.laravel.com/)**: The PHP framework used for the backend.
*   **[Inertia.js](https.inertiajs.com/)**: A tool that lets you quickly build modern single-page React, Vue, and Svelte apps using classic server-side routing and controllers.
*   **[Fortify](https.laravel.com/docs/11.x/fortify)**: A frontend agnostic authentication backend for Laravel.
*   **[Sanctum](https://laravel.com/docs/11.x/sanctum)**: A tool for API token and mobile application authentication.
*   **[Pest](https.pestphp.com/)**: A testing framework for PHP.

### Frontend

*   **[React](https.react.dev/)**: A JavaScript library for building user interfaces.
*   **[React Compiler](https://react.dev/learn/react-compiler)**: A compiler that optimizes React code.
*   **[TypeScript](https://www.typescriptlang.org/)**: A typed superset of JavaScript that compiles to plain JavaScript.
*   **[Vite](https.vitejs.dev/)**: A build tool that provides a faster and leaner development experience for modern web projects.
*   **[Laravel Vite Plugin](https://laravel.com/docs/11.x/vite)**: A plugin that integrates Vite with Laravel.
*   **[@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react)**: A Vite plugin that enables React support.
*   **[@tailwindcss/vite](https://tailwindcss.com/docs/vite)**: A Vite plugin for Tailwind CSS.
*   **[@laravel/vite-plugin-wayfinder](https://github.com/laravel/vite-plugin-wayfinder)**: A Vite plugin that provides a way to automatically discover and register Inertia.js pages.
*   **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapidly building custom designs.
*   **[ESLint](https://eslint.org/)**: A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
*   **[Prettier](https://prettier.io/)**: An opinionated code formatter.

## Project Structure

*   `app`: Contains the core code of the application, including models, controllers, and providers.
*   `bootstrap`: Contains the application's bootstrapping scripts.
*   `config`: Contains the application's configuration files.
*   `database`: Contains the application's database migrations, seeds, and factories.
*   `public`: The web server's document root.
*   `resources`: Contains the application's frontend assets, such as CSS, JavaScript, and views.
*   `routes`: Contains the application's route definitions.
*   `storage`: Contains the application's cache, logs, and other generated files.
*   `tests`: Contains the application's tests.
*   `vendor`: Contains the application's Composer dependencies.
*   `node_modules`: Contains the application's NPM dependencies.

## Scripts

### Composer Scripts

*   `setup`: Installs all the dependencies, creates a `.env` file, generates an application key, and runs the database migrations.
*   `dev`: Starts the development server, which includes the PHP server, the queue listener, a log watcher, and the Vite development server.
*   `dev:ssr`: Builds the SSR application and starts the development server.
*   `test`: Runs the tests.

### NPM Scripts

*   `build`: Builds the frontend assets.
*   `build:ssr`: Builds the frontend assets for SSR.
*   `dev`: Starts the Vite development server.
*   `format`: Formats the code with Prettier.
*   `format:check`: Checks the code formatting with Prettier.
*   `lint`: Lints the code with ESLint.
*   `types`: Checks the types with TypeScript.

## Recommendations

*   **Add more tests**: The project currently has a basic test setup, but it would be beneficial to add more tests to ensure the application is working as expected.
*   **Set up a CI/CD pipeline**: A CI/CD pipeline would automate the process of testing and deploying the application, which would save time and reduce the risk of errors.
*   **Create more detailed documentation**: The `GEMINI.md` file provides a good overview of the project, but it would be helpful to create more detailed documentation for each component and module.

## Contributing

*   **Follow the coding style**: The project uses ESLint and Prettier to enforce a consistent coding style. Please make sure your code follows these guidelines before submitting a pull request.
*   **Write tests**: Please write tests for any new features or bug fixes.
*   **Create a pull request**: Once you have made your changes, please create a pull request with a clear description of the changes you have made.

## License

The project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Disclaimer

This project is a work in progress and is not yet ready for production use.

## Fixes

*   **Fixed a build error**: The project was failing to build because of a missing import. The `home` route was not being exported from the `resources/js/routes/index.ts` file. The fix was to remove the import of the `home` route and replace it with a hardcoded `/` route.

## Known Issues

*   **`/resources/js/routes` directory is ignored**: The `/resources/js/routes` directory is currently being ignored by `.gitignore`. This means that any changes made to the files in this directory will not be tracked by Git. This is because the routes are generated automatically by `vite-plugin-wayfinder`.

## Future

*   **Internationalization**: The project could be improved by adding support for multiple languages. This would involve extracting all the hardcoded strings into translation files and using a library like `react-i18next` to manage the translations.
