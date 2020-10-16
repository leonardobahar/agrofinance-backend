import fs from 'fs'
import bodyParser from 'body-parser'
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import {Dao} from './dao'
import{
    ERROR_DUPLICATE_ENTRY,
    ERROR_FOREIGN_KEY,
    SOMETHING_WENT_WRONG,
    WRONG_BODY_FORMAT
} from "../strings";
import {Karyawan, Karyawan_kerja_dimana, Kategori_transaksi, Pembebanan, Perusahaan, Transaksi} from "../model";

require('gotenv').config()

const app=express()
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.json)

app.use(cors())
app.use((err,req,res,next)=>{
    if(err){
        if(err.type==='entity.parse.failed'){
            res.status(406).send({
                success:false,
                error:'WRONG_JSON_FORMAT'
            })
        }else {
            res.status(400).send({
                success:false,
                error:'CHECK-SERVER-LOG'
            })
            console.log(err)
        }
    }
})

const PORT = process.env.EMPLOYEE_PORT
const host = process.env.MY_SQL_HOST
const user = process.env.MY_SQL_USER
const password = typeof process.env.MY_SQL_PASSWORD === 'undefined' ? '' : process.env.MY_SQL_PASSWORD
const dbname = process.env.MY_SQL_DBNAME
const dao = new Dao(host,user,password,dbname)

app.get("/api/employee/retrieve-karyawan",(req,res)=>{
    if(typeof req.query.id==='undefined'){
        dao.retrieveKaryawan().then(result=>{
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
    }else{
        const employee=new Karyawan(req.query.id,null,null,null,null,null)

        dao.retrieveOneKaryawan(employee).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        })
    }
})

app.post("/api/employee/add-karyawan",(req,res)=>{
    if(req.body.id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(null,req.body.k_nama_lengkap,req.body.k_posisi, req.body.k_nik, req.body.k_role, req.body.k_masih_hidup)

    dao.addKaryawan(employee).then(result=>{
        res.status(200).send({
            success:true,
            result:result
        })
    }).catch(error=>{
        res.status(500).send({
            success:false,
            error:SOMETHING_WENT_WRONG
        })
    })
})

app.post("/api/user/update-karyawan", (req,res)=>{
    if(req.body.id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(req.body.id, req.body.k_nama_lengkap, req.body.k_posisi, req.body.k_nik, req.body.k_role, req.body.k_masih_hidup)

    dao.updateKaryawan(employee).then(result=>{
        res.status(200).send({
            success:true,
            result:result
        })
    }).catch(error=>{
        res.status(500).send({
            success:false,
            error:SOMETHING_WENT_WRONG
        })
    })
})

app.delete("/api/user/delete-karyawan", (req,res)=>{
    if(req.query.id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(req.query.id,null,null,null,null,null)

    dao.deleteKaryawan(employee).then(result=>{
        res.status(200).send({
            success:true,
            result:result
        })
    }).catch(error=>{
        res.status(500).send({
            success:false,
            error:SOMETHING_WENT_WRONG
        })
    })
})

app.listen(PORT, ()=>{
    console.listen(`Server serving port ${PORT}`)
})