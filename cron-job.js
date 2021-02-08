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
            dao.addTransaksi(new Transaksi(
                null,
                transactionResult[i].t_tanggal_transaksi,
                transactionResult[i].t_tanggal_modifikasi,
                dateToday,
                transactionResult[i].t_is_rutin,
                transactionResult[i].t_status,
                transactionResult[i].t_bon_sementara,
                transactionResult[i].t_rekening_penanggung_utama,
                transactionResult[i].t_id_cabang_perusahaan,
                transactionResult[i].t_id_karyawan,
                transactionResult[i].t_is_deleted,
                transactionResult[i].detail_transaksi,
                null,
                transactionResult[i].td_jumlah,
                transactionResult[i].td_id_kategori_transaksi,
                transactionResult[i].td_bpu_attachment,
                transactionResult[i].td_debit_credit,
                transactionResult[i].td_nomor_bukti_transaksi,
                transactionResult[i].td_file_bukti_transaksi,
                transactionResult[i].skema_pembebanan_json,
                transactionResult[i].td_is_deleted
            )).then(result=>{
                res.status(200).send({
                    success:true,
                    result:result
                })
            }).catch(error=>{
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            })
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