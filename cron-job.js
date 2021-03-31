import cron from "node-cron"
import express from "express";
import dotenv from 'dotenv'
import {Dao} from "./dao";
import * as res from "express";
import {NO_SUCH_CONTENT, SOMETHING_WENT_WRONG} from "./strings";
import {Detil_transaksi, Transaksi} from "./model";

const app=express()

dotenv.config()

const PORT = process.env.CRON_PORT
const host = process.env.MY_SQL_HOST
const user = process.env.MY_SQL_USER
const password = typeof process.env.MY_SQL_PASSWORD === 'undefined' ? '' : process.env.MY_SQL_PASSWORD
const dbname = process.env.MY_SQL_DBNAME
const dao = new Dao(host,user,password,dbname)

//cron.schedule("1 0 28-30 * *",function (){
//
//})
cron.schedule("1 0 * * *",function (){
    const dateToday=new Date()
    const date=("0"+dateToday.getDate()).slice(-2)
    const month=("0"+(dateToday.getMonth()+1)).slice(-2)
    const year=dateToday.getFullYear()
    const fullDate=(year+"-"+month+"-"+date)

    const realisasi=dateToday.toISOString().substr(0,19).replace('T', ' ')

    dao.retrieveTodayAndRutinTransaksi(fullDate).then(transactionResult=>{
        for(let i=0; i<transactionResult.length; i++){
            dao.retrieveDetilTransaksi(transactionResult[i].id_transaksi).then(detilTransaksiResult=>{
                let description=[]
                for(let j=0; j<detilTransaksiResult.length; j++){
                    description.push(new Detil_transaksi(
                        detilTransaksiResult[j].td_id_detil_transaksi,
                        detilTransaksiResult[j].td_id_transaksi,
                        detilTransaksiResult[j].td_jumlah,
                        detilTransaksiResult[j].td_id_kategori_transaksi,
                        detilTransaksiResult[j].td_bpu_attachment,
                        detilTransaksiResult[j].td_debit_credit,
                        detilTransaksiResult[j].td_nomor_bukti_transaksi,
                        detilTransaksiResult[j].td_file_bukti_transaksi,
                        detilTransaksiResult[j].skema_pembebanan_json,
                        detilTransaksiResult[j].td_is_deleted,
                        detilTransaksiResult[j].td_is_pembebanan_karyawan,
                        detilTransaksiResult[j].td_is_pembebanan_cabang
                    ))

                    dao.setTransaksiIsNotRutin(fullDate).then(result=>{
                        dao.addTransaksi(new Transaksi(
                            null,
                            'NOW',
                            'NOW',
                            realisasi,
                            transactionResult[i].is_rutin,
                            transactionResult[i].status,
                            transactionResult[i].bon_sementara,
                            transactionResult[i].id_rekening,
                            transactionResult[i].id_cabang,
                            transactionResult[i].id_karyawan,
                            0,
                            JSON.stringify(description),
                            null,
                            detilTransaksiResult[j].td_jumlah,
                            detilTransaksiResult[j].td_id_kategori_transaksi,
                            detilTransaksiResult[j].td_bpu_attachment,
                            detilTransaksiResult[j].td_debit_credit,
                            detilTransaksiResult[j].td_nomor_bukti_transaksi,
                            detilTransaksiResult[j].td_file_bukti_transaksi,
                            detilTransaksiResult[j].skema_pembebanan_json,
                            0
                        )).then(transaksiResult=>{
                            res.status(200).send({
                                success:true,
                                result:transaksiResult
                            })
                        }).catch(error=>{
                            console.error(error)
                            res.status(500).send({
                                success:false,
                                error:SOMETHING_WENT_WRONG
                            })
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
                if(error===NO_SUCH_CONTENT){
                    res.status(204).send({
                        success:false,
                        error:NO_SUCH_CONTENT
                    })
                    return
                }
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            })
        }
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
            return
        }
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