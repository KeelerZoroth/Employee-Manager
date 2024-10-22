// // this file is to allow the program access to the postgres acount

import fs from "fs";

const envFileSting: string = `
DB_NAME=cli_employee_manager_db
DB_USER=postgres
DB_PASSWORD=${process.argv[2]}
            `;
fs.writeFileSync(".env", envFileSting);

