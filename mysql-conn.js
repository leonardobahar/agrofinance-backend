import mysql from 'mysql'

export default (host,user,password,dbname)=>{
    return mysql.createConnection({
        host: host,
        user: user,
        password: password,
        dbname:dbname,
        multipleStatements: true
    })
}