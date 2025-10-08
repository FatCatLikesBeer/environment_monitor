# Back-End for Environment Monitor Project

**This project directory will be for the back end of the environment monitor project. Here we will define the core technologies, file structure, API structure.**

## Core technologies

`deno` for runtime, `deno add npm:[package name]` instead of npm, Express.js, JSON, Sqlite3 (using deno's builtin `node:sqlite` library), Zod

## File Structure
`main.ts`: This is our application entry point.
`maint_test.ts`: This is our test file.
`t.d.ts`: Type definition file.
`db.sqlite`: This will be our Sqlite file.

## API Structure - Incomplete
We will be using version `v0` for this project.
`/api/v0/`: Root API endpoint path
`/api/v0/`:

## Project Data Structure
This project will meter an environment and return the measurements to the user. The data to be stored will be `temperature` and `humidity`, polled from DHT11 sensors. 3 DHT11 sensors will be attached to a single ESP32 microcontroller. There will be more than 1 microcontroller, no anticipated ceiling at this time.

Each microcontroller will be located in a building. Each microcontroller "child" sensor will also be located in a building, but a sensors' building may be different from its "parent" microcontroller or its "sibling" sensor.

The ESP32 microcontroller will be communicating with this back-end application wirelessly VIA http requests. Each microcontroller will have a unique ID assigned when the microcontroller gets flashed.

Anticipated `POST` requests will contain `temperature`, `humidity`, `device_id`.
