import fs from 'fs';
import https from 'https';
import bodyParser from 'body-parser'
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import {Dao} from './dao'
import {
    ERROR_DUPLICATE_ENTRY,
    ERROR_FOREIGN_KEY,
    WRONG_BODY_FORMAT,
    SOMETHING_WENT_WRONG,
    NO_SUCH_CONTENT, MISMATCH_OBJ_TYPE, MAIN_ACCOUNT_EXISTS
} from "./strings";
import {
    Cabang_perusahaan,
    Detil_transaksi,
    Karyawan,
    Karyawan_kerja_dimana,
    Kategori_transaksi,
    Pembebanan,
    Perusahaan, Rekening_perusahaan,
    Transaksi, Transaksi_rekening
} from "./model";
import multer from 'multer'
import path from 'path'

dotenv.config()

const app = express()

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.json())

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
const swaggerJsDoc=require('swagger-jsdoc')
const swaggerUi=require('swagger-ui-express')

// HTTPS
var privateKey  = fs.readFileSync('ssl/privkey.pem', 'utf8');
var certificate = fs.readFileSync('ssl/cert.pem', 'utf8');


//Extended: https://swagger.io/specification/#infoObject
const swaggerOptions={
    swaggerDefinition: {
        info:{
            title:"Agrofinance API",
            description:"Agrofinance Project",
            contact:{
                name:"CodeDoc Software Solution"
            },
            servers:["http://localhost:8088"]
        }
    },
    apis:["app.js"]
}

const swaggerDocs=swaggerJsDoc(swaggerOptions)
app.use("/api-docs",swaggerUi.serve, swaggerUi.setup(swaggerDocs))

/**
 * @swagger
 * /karyawan:
 * get:
 *   description: Use to get all Karyawan(Employees) data
 *   responses:
 *   '200':
 *     description: A successful response
 */
app.get("/api/karyawan/retrieve",(req,res)=>{
    if(typeof req.query.id_karyawan==='undefined'){
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
        const employee=new Karyawan(req.query.id_karyawan,null,null,null,null,null)

        dao.retrieveOneKaryawan(employee).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error===NO_SUCH_CONTENT){
                res.status(204).send({
                    success:false,
                    error:NO_SUCH_CONTENT
                })
            }
            else{
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }
})

app.post("/api/karyawan/add",(req,res)=>{
    if(typeof req.body.nama_lengkap==='undefined' ||
        typeof req.body.posisi==='undefined' ||
        typeof req.body.nik==='undefined' ||
        typeof req.body.role==='undefined' ||
        typeof req.body.masih_hidup==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(null,req.body.nama_lengkap.toUpperCase(),req.body.posisi.toUpperCase(), req.body.nik, req.body.role.toUpperCase(), req.body.masih_hidup.toUpperCase())

    dao.addKaryawan(employee).then(result=>{
        res.status(200).send({
            success:true,
            result:result
        })
    }).catch(error=>{
        if(error.code==='ER_DUP_ENTRY'){
            res.status(500).send({
                success:false,
                error:ERROR_DUPLICATE_ENTRY
            })
        }
        else{
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.post("/api/karyawan/update", (req,res)=>{
    if(typeof req.body.id_karyawan==='undefined' ||
        typeof req.body.nama_lengkap==='undefined' ||
        typeof req.body.posisi==='undefined' ||
        typeof req.body.nik==='undefined' ||
        typeof req.body.role==='undefined' ||
        typeof req.body.masih_hidup==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(req.body.id_karyawan, req.body.nama_lengkap.toUpperCase(), req.body.posisi.toUpperCase(), req.body.nik, req.body.role.toUpperCase(), req.body.masih_hidup.toUpperCase())

    dao.retrieveOneKaryawan(employee).then(result=>{
        dao.updateKaryawan(employee).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error.code==='ER_DUP_ENTRY'){
                res.status(500).send({
                    success:false,
                    error:ERROR_DUPLICATE_ENTRY
                })
            }
            else{
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }

        else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.delete("/api/karyawan/delete", (req,res)=>{
    if(typeof req.query.id_karyawan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(req.query.id_karyawan,null,null,null,null,null)

    dao.retrieveOneKaryawan(employee).then(result=>{
        dao.deleteKaryawan(employee).then(result=>{
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

app.get("/api/perusahaan/retrieve",(req,res)=>{
    if(typeof req.query.id_perusahaan==='undefined'){
        dao.retrievePerusahaan().then(result=>{
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
        const perusahaan=new Perusahaan(req.query.id_perusahaan,null,null)

        dao.retrieveOnePerusahaan(perusahaan).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
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
})

app.post("/api/perusahaan/add",(req,res)=>{
    if(typeof req.body.nama_perusahaan==='undefined' ||
        typeof req.body.nama_cabang==='undefined' ||
        typeof req.body.lokasi==='undefined' ||
        typeof req.body.alamat_lengkap==='undefined' ||
        typeof req.body.nama_bank==='undefined' ||
        typeof req.body.nomor_rekening==='undefined' ||
        typeof req.body.saldo==='undefined'
    ){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const perusahaan=new Perusahaan(null,req.body.nama_perusahaan.toUpperCase())

    dao.addPerusahaan(perusahaan,req.body.nama_cabang.toUpperCase(),req.body.lokasi,req.body.alamat_lengkap,req.body.nama_bank,req.body.nomor_rekening,req.body.saldo).then(result=>{
        res.status(200).send({
            success:true,
            result:result
        })
    }).catch(error=>{
        if(error.code==='ER_DUP_ENTRY'){
            res.status(500).send({
                success:false,
                error:ERROR_DUPLICATE_ENTRY
            })
        }
        else{
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.post("/api/perusahaan/update", (req,res)=>{
    if(typeof req.body.id_perusahaan==='undefined' ||
        typeof req.body.nama_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const perusahaan=new Perusahaan(req.body.id_perusahaan,req.body.nama_perusahaan.toUpperCase())

    dao.retrieveOnePerusahaan(perusahaan).then(result=>{
        dao.updatePerusahaan(perusahaan).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error.code==='ER_DUP_ENTRY'){
                res.status(500).send({
                    success:false,
                    error:ERROR_DUPLICATE_ENTRY
                })
            }
            else{
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }

        else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.delete("/api/perusahaan/delete", (req,res)=>{
    if(req.query.id_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const perusahaan=new Perusahaan(req.query.id_perusahaan,null,null)

    dao.retrieveOnePerusahaan(perusahaan).then(result=>{
        dao.deletePerusahaan(perusahaan).then(result=>{
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
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }

        else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.get("/api/cabang_perusahaan/retrieve",(req,res)=>{
    if(typeof req.query.perusahaan_id==='undefined'){
        dao.retrieveCabangPerusahaan().then(result=>{
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
    }else {
        dao.retrieveCabangPerusahaanByPerusahaanId(req.query.perusahaan_id).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
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
})

app.post("/api/cabang-perusahaan/add",(req,res)=>{
    if(typeof req.body.nama_cabang==='undefined' ||
       typeof req.body.perusahaan_id==='undefined' ||
       typeof req.body.lokasi==='undefined' ||
       typeof req.body.alamat_lengkap==='undefined' ||
       typeof req.body.nama_bank==='undefined' ||
       typeof req.body.nomor_rekening==='undefined' ||
       typeof req.body.saldo==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.addCabangPerusahaan(req.body.nama_cabang.toUpperCase(),req.body.perusahaan_id,req.body.lokasi,req.body.alamat_lengkap,req.body.nama_bank,req.body.nomor_rekening,req.body.saldo,req.body.is_cabang_utama).then(result=>{
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
})

app.post("/api/cabang-perusahaan/set",(req,res)=>{
    if(typeof req.body.id_cabang==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.setDefaultCabangPerusahaan(req.body.id_cabang).then(result=>{
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
})

app.post("/api/cabang-perusahaan/unset",(req,res)=>{
    if(typeof req.body.id_cabang==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.unsetDefaultCabangPerusahaan(req.body.id_cabang).then(result=>{
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
})

app.post("/api/cabang-perushaan/update",(req,res)=>{
    if(typeof req.body.id_cabang==='undefined' ||
       typeof req.body.nama_cabang==='undefined' ||
       typeof req.body.perusahaan_id==='undefined' ||
       typeof req.body.lokasi==='undefined' ||
       typeof req.body.alamat_lengkap==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const cabang=new Cabang_perusahaan(req.body.id_cabang,req.body.nama_cabang.toUpperCase(),req.body.perusahaan_id,req.body.lokasi,req.body.alamat_lengkap,null)
    dao.getCabangPerushaanId(new Cabang_perusahaan(req.body.id_cabang)).then(result=>{
        dao.updateCabangPerusahaan(cabang).then(result=>{
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

app.delete("/api/cabang-perusahaan/delete",(req,res)=>{
    if(typeof req.query.id_cabang==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.getCabangPerushaanId(new Cabang_perusahaan(req.query.id_cabang)).then(result=>{
        dao.deleteCabangPerusahaan(new Cabang_perusahaan(req.query.id_cabang)).then(result=>{
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

app.get("/api/rekening-perusahaan/retrieve",(req,res)=>{
    if(typeof req.query.id_perusahaan==='undefined'){
        dao.retrieveRekeningPerusahaan().then(result=>{
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
        const rekening=new Rekening_perusahaan(null,null,null,null,null,req.query.id_perusahaan)
        dao.retrieveOneRekeningPerusahaan(rekening).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error===NO_SUCH_CONTENT){
                res.status(204).send({
                    success:false,
                    error:NO_SUCH_CONTENT
                })
            }else{
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }
})

app.post("/api/rekening-perusahaan/add",(req,res)=>{
    if(typeof req.body.nama_bank==='undefined' ||
        typeof req.body.nomor_rekening==='undefined' ||
        typeof req.body.saldo==='undefined' ||
        typeof req.body.id_cabang_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.getCabangPerushaanId(new Cabang_perusahaan(req.body.id_cabang_perusahaan,null,null,null,null,null)).then(result=>{
        dao.addRekeningPerusahaan(req.body.nama_bank,req.body.nomor_rekening,req.body.saldo,req.body.id_cabang_perusahaan).then(result=>{
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
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }else{
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.post("/api/rekening-perusahaan/update",(req,res)=>{
    if(typeof req.body.nama_bank==='undefined' ||
        typeof req.body.nomor_rekening==='undefined' ||
        typeof req.body.rekening_utama==='undefined' ||
        typeof req.body.id_cabang_perusahaan==='undefined' ||
        typeof req.body.id_rekening==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const rekening=new Rekening_perusahaan(req.body.id_rekening,req.body.nama_bank,req.body.nomor_rekening,null,req.body.rekening_utama,req.body.id_cabang_perusahaan)

    dao.getRekeningPerusahanId(new Rekening_perusahaan(req.body.id_rekening)).then(result=>{
        dao.updateRekeningPerusahaan(rekening).then(result=>{
            res.status(200).send({
                result:result,
                success:true
            })
        }).catch(error=>{
            console.error(error)
            res.status(500).send({
                error:SOMETHING_WENT_WRONG,
                success:false
            })
        })
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })

})

app.delete("/api/rekening-perusahaan/delete",(req,res)=>{
    if(typeof req.query.id_rekening==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const rekening=new Rekening_perusahaan(req.query.id_rekening,null,null,null,null)
    dao.getRekeningPerusahanId(new Rekening_perusahaan(req.query.id_rekening)).then(result=>{
        dao.deleteRekeningPerusahaan(rekening).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error===NO_SUCH_CONTENT){
                res.status(204).send({
                    success:false,
                    error:NO_SUCH_CONTENT
                })
            }else {
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.post("/api/rekening-utama/set",(req,res)=>{
    if(typeof req.body.id_rekening==='undefined' ||
        typeof req.body.id_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.getRekeningNonUtama(req.body.id_perusahaan).then(result=>{
        dao.setRekeningUtama(req.body.id_rekening).then(result=>{
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
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
            return
        }else if(error===MAIN_ACCOUNT_EXISTS){
            res.status(204).send({
                success:false,
                error:MAIN_ACCOUNT_EXISTS
            })
        }else{
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.post("/api/rekening-utama/unset", (req,res)=>{
    if(typeof req.body.id_rekening==='undefined' ||
        typeof req.body.id_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.getRekeningUtama(req.body.id_perusahaan).then(result=>{
        dao.unsetRekeningUtama(req.body.id_rekening).then(result=>{
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
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
            return
        }else if(error===MAIN_ACCOUNT_EXISTS){
            res.status(204).send({
                success:false,
                error:MAIN_ACCOUNT_EXISTS
            })
        }else{
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.get("/api/transaksi-rekening/retrieve",(req,res)=>{
    if(typeof req.query.id_transaksi==='undefined'){
        dao.retrieveRekeningPerusahaan().then(result=>{
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
        const transfer=new Transaksi_rekening(null,null,null,null,req.query.id_transaksi)
        dao.retrieveOneTransaksiRekening(transfer).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error===NO_SUCH_CONTENT){
                res.status(204).send({
                    success:false,
                    error:NO_SUCH_CONTENT
                })
            }else {
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }
})

app.post("/api/transaksi-rekening/add",(req,res)=>{
    if(typeof req.body.credit==='undefined' ||
        typeof req.body.debit==='undefined' ||
        typeof req.body.id_transaksi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi_rekening(null,'NOW()',req.body.credit,req.body.debit,req.body.id_transaksi)
    dao.addTransaksiRekening(transfer).then(result=>{
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
})

app.post("/api/transaksi-rekening/update",(req,res)=>{
    if(typeof req.body.credit==='undefined' ||
        typeof req.body.debit==='undefined' ||
        typeof req.body.id_transaksi==='undefined' ||
        typeof req.body.id_transaksi_rekening==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }
    const transfer=new Transaksi_rekening(req.body.id_transaksi_rekening,'NOW()',req.body.credit,req.body.debit,req.body.id_transaksi)
    dao.updateTransaksiRekening(transfer).then(result=>{
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

app.delete("/api/transaksi-rekening/delete",(req,res)=>{
    if(typeof req.body.id_transaksi_rekening==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi_rekening(req.body.id_transaksi_rekening,null,null,null,null)
    dao.deleteTransaksiRekening(transfer).then(result=>{
        res.status(200).send({
            success:true,
            result:result
        })
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }else{
            console.error(error)
            res.send(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.get("/api/kategori-transaksi/retrieve",(req,res)=>{
    if(typeof req.query.id_kategori==='undefined'){
        dao.retrieveKategoriTransaksi().then(result=>{
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
        const kategori=new Kategori_transaksi(req.query.id_kategori,null)

        dao.retrieveOneKategoriTransaksi(kategori).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error===NO_SUCH_CONTENT){
                res.status(204).send({
                    success:false,
                    error:NO_SUCH_CONTENT
                })
            }

            else {
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }
})

app.post("/api/kategori-transaksi/add",(req,res)=>{
    if(typeof req.body.nama_kategori==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kategori=new Kategori_transaksi(null,req.body.nama_kategori.toUpperCase())

    dao.addKategoriTransaksi(kategori).then(result=>{
        res.status(200).send({
            success:true,
            result:result
        })
    }).catch(error=>{
        if(error.code==='ER_DUP_ENTRY'){
            res.status(500).send({
                success:false,
                error:ERROR_DUPLICATE_ENTRY
            })
        }
        else{
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.post("/api/kategori-transaksi/update", (req,res)=>{
    if(typeof req.body.id_kategori==='undefined' ||
        typeof req.body.nama_kategori==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kategori=new Kategori_transaksi(req.body.id_kategori,req.body.nama_kategori.toUpperCase())

    dao.retrieveOneKategoriTransaksi(kategori).then(result=>{
        dao.updateKategoriTransaksi(kategori).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error.code==='ER_DUP_ENTRY'){
                res.status(500).send({
                    success:false,
                    error:ERROR_DUPLICATE_ENTRY
                })
            }
            else{
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }

        else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })


})

app.delete("/api/kategori-transaksi/delete", (req,res)=>{
    if(req.query.id_kategori==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kategori=new Kategori_transaksi(req.query.id_kategori,null)

    dao.retrieveOneKategoriTransaksi(kategori).then(result=>{
        dao.deleteKategoriTransaksi(kategori).then(result=>{
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
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }

        else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })


})

const storage=multer.diskStorage({
    destination:'./Uploads/',
    filename: function (req,file,cb){
        cb(null,file.fieldname+'-'+Date.now()+path.extname(file.originalname))
    }
})

const transaksiFilter=(req,file,cb)=>{
    if(!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|doc|docx|pdf|txt|xls|csv|xlsx)$/)){
        req.fileValidationError='Only jpg, png, gif, doc, pdf, txt, xls, csv files are allowed!';
        return cb(new Error('Only jpg, png, gif, doc, pdf, txt, xls, csv files are allowed!'), false)
    }
    cb(null,true);
}

app.get("/api/transaksi/retrieve",(req,res)=>{
    if(typeof req.query.id_transaksi==='undefined'){
        dao.retrieveTransaksi().then(result=>{
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
        const transfer=new Transaksi(req.query.id_transaksi,null,null,null,null,null,null)

        dao.retrieveOneTransaksi(transfer).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error===NO_SUCH_CONTENT){
                res.status(204).send({
                    success:false,
                    error:NO_SUCH_CONTENT
                })
            }

            else {
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }
})

app.post("/api/transaksi/add",async(req,res)=> {
    const upload=multer({storage:storage, fileFilter:transaksiFilter}).single('attachment_transaksi')

    upload(req,res, async (error)=>{

        if(typeof req.body.is_rutin==='undefined' ||
            typeof req.body.bon_sementara==='undefined' ||
            typeof req.body.id_perusahaan==='undefined'){
            res.status(400).send({
                success:false,
                error:WRONG_BODY_FORMAT
            })
            return
        }

        if (typeof req.file.filename==='undefined'){

            const transfer=new Transaksi(null,'NOW','NOW',
                'NULL',req.body.is_rutin, 'Entry di buat',req.body.bon_sementara,
                req.body.id_perusahaan,'0',req.body.detail_transaksi,
                null,req.body.jumlah,req.body.id_kategori_transaksi,
                req.body.jenis,null,req.body.debit_credit,req.body.nomor_bukti_transaksi,
                'BPU',req.body.pembebanan,'0', null)
            dao.addTransaksi(transfer).then(result=>{
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
            // dao.retrieveOneKategoriTransaksi(new Kategori_transaksi(req.query.id_kategori_transaksi)).then(result=>{
            //     dao.retrieveOnePembebanan(new Pembebanan(req.query.pembebanan_id)).then(result=>{
            //         dao.addTransaksi(transfer).then(result=>{
            //             res.status(200).send({
            //                 success:true,
            //                 result:result
            //             })
            //         }).catch(error=>{
            //             console.error(error)
            //             res.status(500).send({
            //                 success:false,
            //                 error:SOMETHING_WENT_WRONG
            //             })
            //         })
            //     }).catch(error=>{
            //         if(error===NO_SUCH_CONTENT){
            //             res.status(204).send({
            //                 success:false,
            //                 error:NO_SUCH_CONTENT
            //             })
            //         }else {
            //             console.error(error)
            //             res.status(500).send({
            //                 success:false,
            //                 error:SOMETHING_WENT_WRONG
            //             })
            //         }
            //     })
            // }).catch(error=>{
            //     if(error===NO_SUCH_CONTENT){
            //         res.status(204).send({
            //             success:false,
            //             error:NO_SUCH_CONTENT
            //         })
            //     } else {
            //         console.error(error)
            //         res.status(500).send({
            //             success:false,
            //             error:SOMETHING_WENT_WRONG
            //         })
            //     }
            // })
        }else{
            if(error instanceof multer.MulterError){
                return res.send(error)
            } else if(error){
                return res.send(error)
            }

            console.log(req.file.filename)

            const transfer=new Transaksi(null,'NOW','NOW','NULL',req.body.is_rutin,'Entry di buat',req.body.bon_sementara,
                req.body.id_perusahaan,'0',req.body.detail_transaksi,null,req.body.jumlah,req.body.id_kategori_transaksi,req.body.jenis,req.file.filename,req.body.debit_credit,req.body.nomor_bukti_transaksi,'BPU',req.body.pembebanan,'0')

            dao.addTransaksi(transfer).then(result=>{
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
            // dao.retrieveOneKategoriTransaksi(new Kategori_transaksi(req.query.id_kategori_transaksi)).then(result=>{
            //     dao.retrieveOnePembebanan(new Pembebanan(req.query.pembebanan_id)).then(result=>{
            //         dao.addTransaksi(transfer).then(result=>{
            //             res.status(200).send({
            //                 success:true,
            //                 result:result
            //             })
            //         }).catch(error=>{
            //             console.error(error)
            //             res.status(500).send({
            //                 success:false,
            //                 error:SOMETHING_WENT_WRONG
            //             })
            //         })
            //     }).catch(error=>{
            //         if(error===NO_SUCH_CONTENT){
            //             res.status(204).send({
            //                 success:false,
            //                 error:NO_SUCH_CONTENT
            //             })
            //         }else {
            //             console.error(error)
            //             res.status(500).send({
            //                 success:false,
            //                 error:SOMETHING_WENT_WRONG
            //             })
            //         }
            //     })
            // }).catch(error=>{
            //     if(error===NO_SUCH_CONTENT){
            //         res.status(204).send({
            //             success:false,
            //             error:NO_SUCH_CONTENT
            //         })
            //     } else {
            //         console.error(error)
            //         res.status(500).send({
            //             success:false,
            //             error:SOMETHING_WENT_WRONG
            //         })
            //     }
            // })
        }
    })
})

app.post("/api/transaksi/approve",(req,res)=>{
    if(typeof req.body.id_transaksi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi(req.query.id_transaksi,null,null,null,null,null,null,null,null,
        null, null,null,null,null,null)

    dao.getTransaksiID(transfer).then(result=>{
        dao.approveTransaksi(transfer).then(result=>{
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
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:WRONG_BODY_FORMAT
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

app.post("/api/transaksi/reject",(req,res)=>{
    if(typeof req.body.id_transaksi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi(req.query.id_transaksi,null,null,null,null,null,null,null,null,
        null, null,null,null,null,null)

    dao.getTransaksiID(transfer).then(result=>{
        dao.rejectTransaksi(transfer).then(result=>{
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
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:WRONG_BODY_FORMAT
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

app.delete("/api/transaksi/delete", (req,res)=>{
    if(typeof req.query.id_transaksi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi(req.query.id_transaksi,null,null,null,null,null,null,null,null,
        null, null,null,null,null,null)

    dao.getTransaksiFile(transfer).then(result=>{

        fs.unlinkSync('./Uploads/'+result.toString())

        dao.deleteTransaksi(transfer).then(result=>{
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
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }

        else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.get("/api/karyawan-kerja-dimana/retrieve",(req,res)=>{
    if(typeof req.query.id_karyawan==='undefined'){
        dao.retrieveKaryawanKerjaDimana().then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(err=>{
            console.error(err)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        })
    }else{
        const kkd=new Karyawan_kerja_dimana(null,req.query.id_karyawan,null)
        dao.retrieveOneKaryawanKerjaDimana(kkd).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(err=>{
            if(err===NO_SUCH_CONTENT){
                res.status(204).send({
                    success:false,
                    error:NO_SUCH_CONTENT
                })
            } else {
                console.error(err)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }
})

app.post("/api/karyawan-kerja-dimana/add",(req,res)=>{
    if(typeof req.body.id_karyawan==='undefined' ||
        typeof req.body.id_cabang==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kkd=new Karyawan_kerja_dimana(null,req.body.id_karyawan,req.body.id_cabang)
    dao.retrieveOneKaryawan(new Karyawan(req.body.id_karyawan,null,null)).then(result=>{
        dao.retrieveCabangPerusahaan(new Perusahaan(req.body.id_cabang)).then(result=>{
            dao.addKaryawan_kerja_dimana(kkd).then(result=>{
                res.status(200).send({
                    success:true,
                    result:result
                })
            }).catch(err=>{
                if(err===NO_SUCH_CONTENT){
                    res.status(204).send({
                        success:false,
                        error:NO_SUCH_CONTENT
                    })
                } else {
                    console.error(err)
                    res.status(500).send({
                        success:false,
                        error:SOMETHING_WENT_WRONG
                    })
                }
            })
        }).catch(error=>{
            if(error===NO_SUCH_CONTENT){
                res.status(204).send({
                    success:false,
                    error:NO_SUCH_CONTENT
                })
            } else {
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        } else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.post("/api/karyawan-kerja-dimana/update", (req,res)=>{
    if(typeof req.body.id_karyawan_kerja_dimana==='undefined' ||
        typeof req.body.id_karyawan==='undefined' ||
        typeof req.body.id_cabang==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kkd=new Karyawan_kerja_dimana(req.body.id_karyawan_kerja_dimana,req.body.id_karyawan,req.body.id_cabang)
    dao.getKaryawanKerjaDimanaByID(kkd).then(result=>{
        dao.retrieveOneKaryawanKerjaDimana(kkd).then(result=>{
            dao.updateKaryawan_kerja_dimana(kkd).then(result=>{
                res.status(200).send({
                    success:true,
                    result:result
                })
            }).catch(err=>{
                if(err.code==='ER_DUP_ENTRY'){
                    res.status(500).send({
                        success:false,
                        error:ERROR_DUPLICATE_ENTRY
                    })
                } else{
                    console.error(err)
                    res.status(500).send({
                        success:false,
                        error:SOMETHING_WENT_WRONG
                    })
                }
            })
        }).catch(error=>{
            if(error===NO_SUCH_CONTENT){
                res.status(204).send({
                    success:false,
                    error:NO_SUCH_CONTENT
                })
            } else {
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        } else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.delete("/api/karyawan-kerja-dimana/delete",(req,res)=>{
    if(typeof req.query.id_karyawan_kerja_dimana==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kkd=new Karyawan_kerja_dimana(req.query.id_karyawan_kerja_dimana,null,null)
    dao.getKaryawanKerjaDimanaByID(kkd).then(result=>{
        dao.deleteKaryawan_kerja_dimana(kkd).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(err=>{
            console.error(err)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        })
    }).catch(error=>{
        if(error===NO_SUCH_CONTENT){
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        } else {
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        }
    })
})

app.listen(PORT, ()=>{
    console.info(`Server serving port ${PORT}`)
})

const httpsServe = https.createServer({
    key: privateKey,
    cert: certificate
},app);

httpsServe.listen(8089);
