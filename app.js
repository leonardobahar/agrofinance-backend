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
    SOMETHING_WENT_WRONG
} from "./strings";
import {Karyawan,Karyawan_kerja_dimana,Kategori_transaksi,Pembebanan,Perusahaan,Transaksi} from "./model";
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
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
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
        console.error(error)
        res.status(500).send({
            success:false,
            error:SOMETHING_WENT_WRONG
        })
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

    dao.updateKaryawan(employee).then(result=>{
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

app.delete("/api/karyawan/delete", (req,res)=>{
    if(typeof req.query.id_karyawan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(req.query.id_karyawan,null,null,null,null,null)
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
        console.error(error)
        res.status(500).send({
            success:false,
            error:SOMETHING_WENT_WRONG
        })
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

    dao.updatePerusahaan(perusahaan).then(result=>{
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

app.delete("/api/perusahaan/delete", (req,res)=>{
    if(req.query.id_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const perusahaan=new Perusahaan(req.query.id_perusahaan,null,null)

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
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
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
        console.error(error)
        res.status(500).send({
            success:false,
            error:SOMETHING_WENT_WRONG
        })
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

    dao.updatePembebanan(pembebanan).then(result=>{
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

app.delete("/api/pemebebanan/delete", (req,res)=>{
    if(typeof req.query.id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const pembebanan=new Pembebanan(req.query.id,null)

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
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
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
        console.error(error)
        res.status(500).send({
            success:false,
            error:SOMETHING_WENT_WRONG
        })
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

    dao.updateKategoriTransaksi(kategori).then(result=>{
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

app.delete("/api/kategori-transaksi/delete", (req,res)=>{
    if(req.query.id_kategori==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kategori=new Kategori_transaksi(req.query.id_kategori,null)

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
        const transfer=new Transaksi(req.query.id_transaksi,null,null,null,null,null,null,null,null,
            null, null,null,null,null,null)

        dao.retrieveOneTransaksi(transfer).then(result=>{
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
})

app.post("/api/transaksi/add",async(req,res)=>{
    const upload=multer({storage:storage, fileFilter:transaksiFilter}).single('attachment_transaksi')

    console.log(req.file)
    upload(req,res,async (err)=>{

        if(typeof req.query.jumlah==='undefined' ||
            typeof req.query.id_kategori_transaksi==='undefined' ||
            typeof req.query.jenis==='undefined' ||
            typeof req.file.filename==='undefined' ||
            typeof req.query.debit_credit==='undefined' ||
            typeof req.query.status==='undefined' ||
            typeof req.query.bon_sementara==='undefined' ||
            typeof req.query.is_rutin==='undefined' ||
            typeof req.query.tanggal_transaksi==='undefined' ||
            typeof req.query.tanggal_modifikasi==='undefined' ||
            typeof req.query.tanggal_realisasi==='undefined' ||
            typeof req.query.nomor_bukti_transaksi==='undefined' ||
            typeof req.query.pembebanan_id==='undefined'){
            res.status(400).send({
                success:false,
                error:WRONG_BODY_FORMAT
            })
            return
        }

        if(err instanceof multer.MulterError){
            return res.send(err)
        }

        else if(err){
            return res.send(err)
        }

        console.log(req.file.filename)

        const transfer=new Transaksi(null,req.query.jumlah,req.query.id_kategori_transaksi,req.query.jenis,req.file.filename,req.query.debit_credit,req.query.status,req.query.bon_sementara,req.query.is_rutin,
            req.query.tanggal_transaksi,req.query.tanggal_modifikasi,req.query.tanggal_realisasi,req.query.nomor_bukti_transaksi,'BPU',req.query.pembebanan_id)

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
    })
})

app.post("/api/transaksi/update", (req,res)=>{
    if(typeof req.body.id_transaksi==='undefined' ||
        typeof req.body.jumlah==='undefined' ||
        typeof req.body.id_kategori_transaksi==='undefined' ||
        typeof req.body.jenis==='undefined' ||
        typeof req.body.bpu_attachment==='undefined' ||
        typeof req.body.debit_credit==='undefined' ||
        typeof req.body.status==='undefined' ||
        typeof req.body.bon_sementara==='undefined' ||
        typeof req.body.is_rutin==='undefined' ||
        typeof req.body.tanggal_transaksi==='undefined' ||
        typeof req.body.tanggal_modifikasi==='undefined' ||
        typeof req.body.tanggal_realisasi==='undefined' ||
        typeof req.body.nomor_bukti_transaksi==='undefined' ||
        typeof req.body.file_bukti_transaksi==='undefined' ||
        typeof req.body.pembebanan_id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi(req.body.id_transaksi,req.body.jumlah,req.body.id_kategori_transaksi,req.body.jenis,req.body.bpu_attachment,req.body.debit_credit,req.body.status,req.body.bon_sementara,req.body.is_rutin,
        req.body.tanggal_transaksi,req.body.tanggal_modifikasi,req.body.tanggal_realisasi,req.body.nomor_bukti_transaksi,req.body.file_bukti_transaksi,req.body.pembebanan_id)

    dao.updateTransaksi(transfer).then(result=>{
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
            console.error(err)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
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
    dao.addKaryawan_kerja_dimana(kkd).then(result=>{
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
    dao.updateKaryawan_kerja_dimana(kkd).then(result=>{
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
})

app.delete("/api/karyawan-kerja-dimana/delete",(req,res)=>{
    if(typeof req.query.id_karyawan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kkd=new Karyawan_kerja_dimana(null,req.query.id_karyawan,null)
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
})

app.listen(PORT, ()=>{
    console.info(`Server serving port ${PORT}`)
})
