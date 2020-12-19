import {Dao} from "./dao";
import dotenv from "dotenv";
import "core-js/stable";
import "regenerator-runtime/runtime";

dotenv.config()
const PORT = process.env.EMPLOYEE_PORT
const host = process.env.MY_SQL_HOST
const user = process.env.MY_SQL_USER
const password = typeof process.env.MY_SQL_PASSWORD === 'undefined' ? '' : process.env.MY_SQL_PASSWORD
const dbname = process.env.MY_SQL_DBNAME
const dao = new Dao(host,user,password,dbname)

test('Database - Table Existence', done=>{
    dao.mysqlConn.query("SHOW TABLES;", (err, res)=>{
        expect(true).toBe(true)
        done()
    })
})

test("Test login module", done=>{
    dao.login("Bob", "password").then(result=>{

    }).catch(err=>{
        expect(err).toBe("FALSE_AUTH")
        done()
    })
})