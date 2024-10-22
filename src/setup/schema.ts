import {pool, connectToDb} from "../connection.js"

import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;

// these lines creates a clean database called cli_employee_manager_db
const gresPool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: 'localhost',
  database: 'postgres',
  port: 5432,
});

await gresPool.connect();

await gresPool.query(`DROP DATABASE IF EXISTS cli_employee_manager_db;`);

await gresPool.query(`CREATE DATABASE cli_employee_manager_db;`);

// these line populate the database with tables
await connectToDb();

await pool.query(`CREATE TABLE department(
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE role(
    id SERIAL PRIMARY KEY,
    title VARCHAR(30) UNIQUE NOT NULL,
    salary DECIMAL NOT NULL,
    department_id INTEGER NOT NULL,
    FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL
);

CREATE TABLE employee(
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INTEGER NOT NULL,
    manager_id INTEGER,
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (manager_id) REFERENCES employee(id) ON DELETE SET NULL
);`);

process.exit();