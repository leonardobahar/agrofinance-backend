import fs from 'fs';
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
    NO_SUCH_CONTENT
} from "./strings";
import {
    Detil_transaksi,
    Karyawan,
    Karyawan_kerja_dimana,
    Kategori_transaksi,
    Pembebanan,
    Perusahaan, Rekening_perusahaan,
    Transaksi
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

app.post("/api/perusahaan/add",(req,res)=>{
    if(typeof req.body.nama_perusahaan==='undefined' ||
        typeof req.body.alamat==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const perusahaan=new Perusahaan(null,req.body.nama_perusahaan.toUpperCase(),req.body.alamat)

    dao.addPerusahaan(perusahaan).then(result=>{
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
       typeof req.body.nama_perusahaan==='undefined' ||
       typeof req.body.alamat==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const perusahaan=new Perusahaan(req.body.id_perusahaan,req.body.nama_perusahaan.toUpperCase(),req.body.alamat)

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
        const rekening=new Rekening_perusahaan(null,null,null,null,req.query.rp_id_perusahaan)
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
       typeof req.body.id_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const rekening=new Rekening_perusahaan(null,req.body.nama_bank,req.body.nomor_rekening,req.body.saldo,req.body.id_perusahaan)
    dao.retrieveOnePerusahaan(new Perusahaan(req.body.id_perusahaan,null,null)).then(result=>{
        dao.addRekeningPerusahaan(rekening).then(result=>{
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
        } else {
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
        typeof req.body.saldo==='undefined' ||
        typeof req.body.id_perusahaan==='undefined' ||
        typeof req.body.id_rekening==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const rekening=new Rekening_perusahaan(req.body.id_rekening,req.body.nama_bank,req.body.nomor_rekening,req.body.saldo,req.body.id_perusahaan)
    dao.retrieveOneRekeningPerusahaan(new Rekening_perusahaan())
})

app.get("/api/pemebebanan/retrieve",(req,res)=>{
    if(typeof req.query.id==='undefined'){
        dao.retrievePembebanan().then(result=>{
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
        const pembebanan=new Pembebanan(req.query.id,null)

        dao.retrieveOnePembebanan(pembebanan).then(result=>{
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
            } else{
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    }
})

app.post("/api/pemebebanan/add",(req,res)=>{
    if(typeof req.body.pembebanan_json==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const pembebanan=new Pembebanan(null,req.body.pembebanan_json)

    dao.addPembebanan(pembebanan).then(result=>{
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

app.post("/api/pemebebanan/update", (req,res)=>{
    if(typeof req.body.id==='undefined' ||
       typeof req.body.pembebanan_json==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const pembebanan=new Pembebanan(req.body.id,req.body.pembebanan_json)

    dao.retrieveOnePembebanan(pembebanan).then(result=>{
        dao.updatePembebanan(pembebanan).then(result=>{
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

app.delete("/api/pemebebanan/delete", (req,res)=>{
    if(typeof req.query.id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const pembebanan=new Pembebanan(req.query.id,null)

    dao.retrieveOnePembebanan(pembebanan).then(result=>{
        dao.deletePembebanan(pembebanan).then(result=>{
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

        if(typeof req.query.is_rutin==='undefined' ||
            typeof req.query.bon_sementara==='undefined'||
            typeof req.query.jumlah==='undefined' ||
            typeof req.query.id_kategori_transaksi==='undefined' ||
            typeof req.query.jenis==='undefined' ||
            typeof req.file.filename==='undefined' ||
            typeof req.query.debit_credit==='undefined' ||
            typeof req.query.nomor_bukti_transaksi==='undefined' ||
            typeof req.query.pembebanan_id==='undefined'){
            res.status(400).send({
                success:false,
                error:WRONG_BODY_FORMAT
            })
            return
        }

        if(error instanceof multer.MulterError){
            return res.send(error)
        }

        else if(error){
            return res.send(error)
        }

        console.log(req.file.filename)

        const transfer=new Transaksi(null,'NOW','NOW','NULL',req.query.is_rutin,'Entry di buat',req.query.bon_sementara,
            '0',null,req.query.jumlah,req.query.id_kategori_transaksi,req.query.jenis,req.file.filename,req.query.debit_credit,req.query.nomor_bukti_transaksi,'BPU',req.query.pembebanan_id,'0')

        dao.retrieveOneKategoriTransaksi(new Kategori_transaksi(req.query.id_kategori_transaksi)).then(result=>{
            dao.retrieveOnePembebanan(new Pembebanan(req.query.pembebanan_id)).then(result=>{
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
            } else {
                console.error(error)
                res.status(500).send({
                    success:false,
                    error:SOMETHING_WENT_WRONG
                })
            }
        })
    })
})

app.post("/api/transaksi/update", (req,res)=>{
    const upload=multer({storage:storage, fileFilter:transaksiFilter}).single('attachment_transaksi')

    if(typeof req.query.is_rutin==='undefined' ||
        typeof req.query.bon_sementara==='undefined'||
        typeof req.query.jumlah==='undefined' ||
        typeof req.query.id_kategori_transaksi==='undefined' ||
        typeof req.query.jenis==='undefined' ||
        typeof req.file.filename==='undefined' ||
        typeof req.query.debit_credit==='undefined' ||
        typeof req.query.nomor_bukti_transaksi==='undefined' ||
        typeof req.query.pembebanan_id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi(req.body.id_transaksi,req.body.jumlah,req.body.id_kategori_transaksi,req.body.jenis,req.body.bpu_attachment,req.body.debit_credit,req.body.status,req.body.bon_sementara,req.body.is_rutin,
        'NOW','NOW','NOW',req.body.nomor_bukti_transaksi,req.body.file_bukti_transaksi,req.body.pembebanan_id)

    dao.retrieveOneTransaksi(transfer).then(result=>{
        dao.updateTransaksi(transfer).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error.code===ER_DUP_ENTRY){
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
            }

            else {
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
       typeof req.body.id_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kkd=new Karyawan_kerja_dimana(null,req.body.id_karyawan,req.body.id_perusahaan)
    dao.retrieveOneKaryawan(new Karyawan(req.body.id_karyawan,null,null)).then(result=>{
        dao.retrieveOnePerusahaan(new Perusahaan(req.body.id_perusahaan)).then(result=>{
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
                }

                else {
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
            }

            else {
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

app.post("/api/karyawan-kerja-dimana/update", (req,res)=>{
    if(typeof req.body.id_karyawan_kerja_dimana==='undefined' ||
       typeof req.body.id_karyawan==='undefined' ||
       typeof req.body.id_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kkd=new Karyawan_kerja_dimana(req.body.id_karyawan_kerja_dimana,req.body.id_karyawan,req.body.id_perusahaan)
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

app.listen(PORT, ()=>{
    console.info(`Server serving port ${PORT}`)
})