import inquirer from "inquirer";
import {pool} from "./connection.js";

class CLI {
    exit: boolean;

    constructor(){
        this.exit = false;
    }

    // handles user actions and loops until exit is chosen
    start(){
        inquirer.prompt([
            {
                type:"list",
                name:"choice",
                message:"What do you want to do?",
                choices:[
                    {
                        name:"View All Employees",
                        value:"VAEmployees"
                    },
                    {
                        name:"Add Employee",
                        value:"AEmployee"
                    },
                    {
                        name:"Update Employee Role",
                        value:"UEmployeeRole"
                    },
                    {
                        name:"View All Roles",
                        value:"VARoles"
                    },
                    {
                        name:"Add Role",
                        value:"ARole"
                    },
                    {
                        name:"View All Departments",
                        value:"VADepartments"
                    },
                    {
                        name:"View Department Budgets",
                        value:"VDepartmentBudgets" 
                    },
                    {
                        name:"Add Department",
                        value:"ADepartment"
                    },
                    {
                        name:"Exit",
                        value:"exit"
                    }
                ]
            }
        ]).then(async (answer) => {
            switch(answer.choice){
                case "VAEmployees":
                    // displays data in a table by employee, manager, or department with indexed rows
                    this.displayEmployeeTable();
                    return
                break;
                case "AEmployee":
                    // create new employee row
                    await this.createNewEmployeeRow();
                    // stop this start function so the above function can run by itself
                    return
                break;
                case "UEmployeeRole":
                    // update an existing employee
                    this.updateEmployeeRow();
                    // stop this start function so the above function can run by itself
                    return
                break;
                case "VARoles":
                    // displays data in a table with indexed rows
                    console.table((await pool.query("SELECT role.id, role.title, department.name, role.salary FROM role JOIN department ON role.department_id = department.id")).rows);
                break;
                case "ARole":
                    // creates new role row
                    this.createNewRoleRow();
                    // stop this start function so the above function can run by itself
                    return
                break;
                case "VADepartments":
                    // displays data in a table with indexed rows
                    console.table((await pool.query("SELECT * FROM department")).rows);
                break;
                case "VDepartmentBudgets":
                    await this.displayDeparmentBudget();
                break;
                case "ADepartment":
                    // create new department row
                    this.createNewDepartmentRow();
                    // stop this start function so the above function can run by itself
                    return
                break;
                case "exit":
                    console.log("exit");
                    this.exit = true;
                break;
                default:
                    console.log("Something Broke...");
                break;
            }
            if (!this.exit){
                this.start(); 
            } else {
                process.exit();
            }
        });
    };

    // get the selected table's contents
    private async getTableValues(selectedTable: string){
        return (await pool.query(`SELECT * FROM ${selectedTable}`)).rows;
    };

    // the function to display data in the employee table by employee, manager, or department with indexed rows
    private async displayEmployeeTable(){

        const {displayType} = await inquirer.prompt([
            {
                type:"list",
                name:"displayType",
                message:"View by Employee, Manager, or Department?",
                choices:[
                    {
                        name: "Employee",
                        value: "employee"
                    },
                    {
                        name: "Manager",
                        value: "manager"
                    },
                    {
                        name: "Department",
                        value: "department"
                    }
                ]
            }
        ]);


        switch(displayType){
            case "employee":
                console.table((await pool.query(`SELECT EA.id, EA.first_name, EA.last_name, role.title AS role, department.name AS department, role.salary, CONCAT(EB.first_name, ' ', EB.last_name) AS manager
                            FROM employee EA
                            LEFT JOIN employee EB ON EA.manager_id = EB.id
                            JOIN role ON EA.role_id = role.id
                            JOIN department ON role.department_id = department.id;`)).rows);
            break;
            case "manager":
                console.table((await pool.query(`SELECT CONCAT(EB.first_name, ' ', EB.last_name) AS manager, EA.id AS employee_id, EA.first_name, EA.last_name, role.title AS role, department.name AS department, role.salary
                            FROM employee EA
                            RIGHT JOIN employee EB ON EA.manager_id = EB.id
                            JOIN role ON EA.role_id = role.id
                            JOIN department ON role.department_id = department.id;`)).rows);
            break;
            case "department":
                console.table((await pool.query(`SELECT department.name AS department, EA.id AS employee_id, EA.first_name, EA.last_name, role.title AS role, role.salary, CONCAT(EB.first_name, ' ', EB.last_name) AS manager
                            FROM employee EA
                            LEFT JOIN employee EB ON EA.manager_id = EB.id
                            JOIN role ON EA.role_id = role.id
                            JOIN department ON role.department_id = department.id;`)).rows);
            break;
        }
        
        // restarts the loop
        this.start();
    }

    // this activates a inquirer prompt to create a new employee row
    private async createNewEmployeeRow(){
        // gets the organized data for chooseing a manager
        const managerChoices = (await this.getTableValues("employee")).map((element) => {
            return {
                name: element.first_name + " " + element.last_name,
                value: element.id
            }
        });
        
        // gets the organized data for chooseing a role
        const roleChoices = (await this.getTableValues("role")).map((element) => {
            return {
                name: element.title,
                value: element.id
            }
        });
        
        const {firstName, lastName, roleId, managerId}: {firstName: string, lastName: string, roleId: number, managerId: number|null} = await inquirer.prompt([
            {
                name: "firstName",
                message: "What is the employee's first name?",
            },
            {
                name: "lastName",
                message: "What is the employee's last name?",
            },
            {
                type:"list",
                name: "roleId",
                message: "What is the employee's role?",
                choices: roleChoices
            },
            {
                type:"list",
                name: "managerId",
                message: "Who is the employee's manager?",
                choices: [
                    {
                        name:"none",
                        value: null
                    },
                    ...managerChoices
                ]
            }
        ]);
        // add the new row
        pool.query("INSERT INTO employee(first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)", [firstName, lastName, roleId, managerId]);

        // restarts the loop
        this.start();
    }

    // this activates a inquirer prompt to create a new role row
    private async createNewRoleRow(){
        // gets the organized data for chooseing a department
        const departmentChoices = (await this.getTableValues("department")).map((element) => {
            return {
                name: element.name,
                value: element.id
            }
        });

        const {title, salary: salary, departmentId}: {title: string, salary: number, departmentId: number} = await inquirer.prompt([
            {
                name: "title",
                message: "What is the role's title?",
            },
            {
                name: "salary",
                message: "What is the role's salary?"
            },
            {
                type: "list",
                name: "departmentId",
                message: "What department does this role belong to?",
                choices: departmentChoices
            }
        ]);

        // add the new row
        pool.query("INSERT INTO role(title, salary, department_id) VALUES ($1, $2, $3)", [title, salary, departmentId]);

        // restarts the loop
        this.start();
    }

    // this activates a inquirer prompt to create a new department row
    private async createNewDepartmentRow(){
        
        const {dName}: {dName: string} = await inquirer.prompt([
            {
                name: "dName",
                message: "What is the department's name?",
            }
        ]);

        // add the new row
        pool.query("INSERT INTO department(name) VALUES ($1)", [dName]);

        // restarts the loop
        this.start();
    }


    private async updateEmployeeRow (){
        // gets the organized data for chooseing a manager
        const managerAndEmployeeChoices = (await this.getTableValues("employee")).map((element) => {
            return {
                name: element.first_name + " " + element.last_name,
                value: element.id
            }
        });
        
        // gets the organized data for chooseing a role
        const roleChoices = (await this.getTableValues("role")).map((element) => {
            return {
                name: element.title,
                value: element.id
            }
        });
        
        const {employeeId, roleId, managerId}: {employeeId: number, roleId: number, managerId: number|null} = await inquirer.prompt([
            {
                type:"list",
                name: "employeeId",
                message: "Which employee do you want to update?",
                choices: managerAndEmployeeChoices
            },
            {
                type:"list",
                name: "roleId",
                message: "What is the emloyee's new role?",
                choices: roleChoices
            },
            {
                type:"list",
                name: "managerId",
                message: "Who is the employee's manager?",
                choices: [
                    {
                        name:"none",
                        value: null
                    },
                    ...managerAndEmployeeChoices
                ]
            }
        ]);
        pool.query("UPDATE employee SET role_id = $2, manager_id = $3 WHERE id = $1", [employeeId, roleId, managerId]);

        this.start();
    }

    private async displayDeparmentBudget(){
        console.table((await pool.query(`SELECT department.id, department.name, SUM(role.salary) AS budget
            FROM department
            LEFT JOIN role ON role.department_id = department.id
            LEFT JOIN employee ON employee.role_id = role.id 
            GROUP BY department.id, department.name;`)).rows);
    }

}


export default new CLI();
