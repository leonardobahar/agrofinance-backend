import cron from "node-cron"
import express from "express";
import dotenv from 'dotenv'
import {Dao} from "./dao";
import * as res from "express";
import {SOMETHING_WENT_WRONG} from "./strings";
import {Transaksi} from "./model";

const app=express()

dotenv.config()

const PORT = process.env.CRON_PORT
const host = process.env.MY_SQL_HOST
const user = process.env.MY_SQL_USER
const password = typeof process.env.MY_SQL_PASSWORD === 'undefined' ? '' : process.env.MY_SQL_PASSWORD
const dbname = process.env.MY_SQL_DBNAME
const dao = new Dao(host,user,password,dbname)

cron.schedule("1 0 * * *",function (){
    const dateToday=new Date()
    const date=("0"+dateToday.getDate().slice(-2))

    dao.retrieveTodayAndRutinTransaksi(date).then(transactionResult=>{
        for(let i=0; i<transactionResult.length; i++){

        }
    }).catch(error=>{
        console.error(error)
        res.status(500).send({
            success:false,
            error:SOMETHING_WENT_WRONG
        })
    })
})

app.listen(PORT, ()=>{
    console.info(`Server serving port ${PORT}`)
})