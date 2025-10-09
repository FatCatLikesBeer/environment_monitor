# Back-End for Environment Monitor Project

**This project directory will be for the back end of the environment monitor project.**

## Core technologies

`deno` for runtime, `deno add npm:[package name]` instead of npm, Express.js, JSON, Sqlite3 (using deno's builtin `node:sqlite` library), Zod

## File Structure
* `main.ts`: This is our application entry point.
* `maint_test.ts`: This is our test file.
* `t.d.ts`: Type definition file.
* `db.sqlite`: This will be our Sqlite file.

## Styling and Conventions
* API endpoints will always be prefaced with: `/api/v0/`.
* Resource names will be in plural.
* Variable names with multiple words will be camelCase.
* `import` statements in files shall omit `npm:` prefixes. By including "npm:" in the import string, it disrupts my LSP.
* `temperature` values will be in Celsius. `humidity` values will be in relative humidity.

## RESTful JSON API Structure
* GET - `/api/v0/data` - Returns the default 2 week time range of sensor data. Optional parameters: `timeRange`, `building`.
* POST - `/api/v0/data` - Request body will contain DeviceData. Since this endpoint will be use almost exclusively by the microcontroller, a response may or may not be needed.
* GET - `/api/v0/buildings` - Returns building names, their corresponding IDs, and the total number of devices and sensors attributed to each building.
* PUT - `/api/v0/buildings` - Modifies building name.

## Project Data Structure
This project will meter an environment and return the measurements to the user. The data to be stored will be `temperature` and `humidity`, polled from DHT22 sensors. 3 DHT22 sensors will be attached to a single ESP32 microcontroller. There will be more than 1 microcontroller, no anticipated ceiling at this time.

Each microcontroller will be located in a building. Each microcontroller "child" sensor will also be located in a building, but a sensors' building may be different from its "parent" microcontroller or its "sibling" sensor.

The ESP32 microcontroller will be communicating with this back-end application wirelessly VIA http requests. Each microcontroller will have a unique ID, and each attached sensor will also have a unique ID assigned when the microcontroller gets flashed.

Anticipated `POST` requests will contain `temperature`, `humidity`, `device_id`, `sensor_id`.














