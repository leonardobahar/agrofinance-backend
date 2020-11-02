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

require('dotenv').config()

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

app.get("/api/retrieve-karyawan",(req,res)=>{
    if(typeof req.query.k_id_karyawan==='undefined'){
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
        const employee=new Karyawan(req.query.k_id_karyawan,null,null,null,null,null)

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

app.post("/api/add-karyawan",(req,res)=>{
    if(req.body.k_nama_lengkap==='undefined' ||
       req.body.k_posisi==='undefined' ||
       req.body.k_nik==='undefined' ||
       req.body.k_role==='undefined' ||
       req.body.k_masih_hidup==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(null,req.body.k_nama_lengkap.toUpperCase(),req.body.k_posisi.toUpperCase(), req.body.k_nik, req.body.k_role.toUpperCase(), req.body.k_masih_hidup.toUpperCase())

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

app.post("/api/update-karyawan", (req,res)=>{
    if(req.body.k_id_karyawan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(req.body.k_id_karyawan, req.body.k_nama_lengkap.toUpperCase(), req.body.k_posisi.toUpperCase(), req.body.k_nik, req.body.k_role.toUpperCase(), req.body.k_masih_hidup.toUpperCase())

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

app.delete("/api/delete-karyawan", (req,res)=>{
    if(req.query.k_id_karyawan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(req.query.k_id_karyawan,null,null,null,null,null)

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

app.get("/api/retrieve-perusahaan",(req,res)=>{
    if(typeof req.query.p_id_perusahaan==='undefined'){
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
        const perusahaan=new Perusahaan(req.query.p_id_perusahaan,null,null)

        dao.retrieveOnePerusahaan(perusahaan).then(result=>{
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

app.post("/api/add-perusahaan",(req,res)=>{
    if(req.body.p_nama_perusahaan==='undefined' ||
       req.body.p_alamat==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const perusahaan=new Perusahaan(null,req.body.p_nama_perusahaan.toUpperCase(),req.body.p_alamat)

    dao.addPerusahaan(perusahaan).then(result=>{
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

app.post("/api/update-perusahaan", (req,res)=>{
    if(req.body.p_id_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const perusahaan=new Perusahaan(req.body.p_id_perusahaan,req.body.p_nama_perusahaan.toUpperCase(),req.body.p_alamat)

    dao.updatePerusahaan(perusahaan).then(result=>{
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

app.delete("/api/delete-perusahaan", (req,res)=>{
    if(req.query.p_id_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const perusahaan=new Perusahaan(req.query.p_id_perusahaan,null,null)

    dao.deletePerusahaan(perusahaan).then(result=>{
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

app.get("/api/retrieve-pemebebanan",(req,res)=>{
    if(typeof req.query.pbb_id==='undefined'){
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
        const pembebanan=new Pembebanan(req.query.pbb_id,null)

        dao.retrieveOnePembebanan(pembebanan).then(result=>{
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

app.post("/api/add-pembebanan",(req,res)=>{
    if(req.body.pbb_id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const pembebanan=new Pembebanan(null,req.body.skema_pembebanan_json)

    dao.addPembebanan(pembebanan).then(result=>{
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

app.post("/api/update-pembebanan", (req,res)=>{
    if(req.body.pbb_id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const pembebanan=new Pembebanan(req.body.pbb_id,req.body.skema_pembebanan_json)

    dao.updatePembebanan(pembebanan).then(result=>{
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

app.delete("/api/delete-pembebanan", (req,res)=>{
    if(req.query.pbb_id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const pembebanan=new Pembebanan(req.query.pbb_id,null)

    dao.deletePembebanan(pembebanan).then(result=>{
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

app.get("/api/retrieve-kategori-transaksi",(req,res)=>{
    if(typeof req.query.kt_id_kategori==='undefined'){
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
        const kategori=new Kategori_transaksi(req.query.kt_id_kategori,null)

        dao.retrieveOneKategoriTransaksi(kategori).then(result=>{
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

app.post("/api/add-kategori-transaksi",(req,res)=>{
    if(req.body.kt_id_kategori==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kategori=new Kategori_transaksi(null,req.body.kt_nama_kategori.toUpperCase())

    dao.addKategoriTransaksi(kategori).then(result=>{
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

app.post("/api/update-kategori-transaksi", (req,res)=>{
    if(req.body.kt_id_kategori==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kategori=new Kategori_transaksi(req.body.kt_id_kategori,req.body.kt_nama_kategori.toUpperCase())

    dao.updateKategoriTransaksi(kategori).then(result=>{
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

app.delete("/api/delete-kategori-transaksi", (req,res)=>{
    if(req.query.kt_id_kategori==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const kategori=new Kategori_transaksi(req.query.kt_id_kategori,null)

    dao.deleteKategoriTransaksi(kategori).then(result=>{
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

app.get("/api/retrieve-transaksi",(req,res)=>{
    if(typeof req.query.t_id_transaksi==='undefined'){
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
        const transfer=new Transaksi(req.query.t_id_transaksi,null,null,null,null,null,null,null,null,
            null, null,null,null,null,null)

        dao.retrieveOneTransaksi(transfer).then(result=>{
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

app.post("/api/add-transaksi",(req,res)=>{
    if(req.body.t_id_transaksi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi(null,req.body.t_jumlah,req.body.t_id_kategori_transaksi,req.body.t_jenis,req.body.t_bpu_attachment,req.body.t_debit_card,req.body.t_status,req.body.t_bon_sementara,req.body.t_is_rutin,
        req.body.t_tanggal_transaksi,req.body.t_tanggal_modifikasi,req.body.t_tanggal_realisi,req.body.t_nomor_bukti_transaksi,req.body.t_file_bukti_transaksi,req.body.t_pembebanan_id)

    dao.addTransaksi(transfer).then(result=>{
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

app.post("/api/update-transaksi", (req,res)=>{
    if(req.body.t_id_transaksi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi(req.body.t_id_transaksi,req.body.t_jumlah,req.body.t_id_kategori_transaksi,req.body.t_jenis,req.body.t_bpu_attachment,req.body.t_debit_card,req.body.t_status,req.body.t_bon_sementara,req.body.t_is_rutin,
        req.body.t_tanggal_transaksi,req.body.t_tanggal_modifikasi,req.body.t_tanggal_realisi,req.body.t_nomor_bukti_transaksi,req.body.t_file_bukti_transaksi,req.body.t_pembebanan_id)

    dao.updateTransaksi(transfer).then(result=>{
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

app.delete("/api/delete-transaksi", (req,res)=>{
    if(req.query.t_id_transaksi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi(req.query.t_id_transaksi,null,null,null,null,null,null,null,null,
        null, null,null,null,null,null)

    dao.deleteTransaksi(transfer).then(result=>{
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
    console.info(`Server serving port ${PORT}`)
})