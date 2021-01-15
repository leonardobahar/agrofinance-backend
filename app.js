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
    NO_SUCH_CONTENT, MISMATCH_OBJ_TYPE, MAIN_ACCOUNT_EXISTS, NO_MAIN_AACOUNT
} from "./strings";
import {
    Cabang_perusahaan,
    Detil_transaksi,
    Karyawan,
    Karyawan_kerja_dimana,
    Kategori_transaksi,
    Pembebanan,
    Perusahaan, Posisi, Role, Rekening_perusahaan,
    Transaksi, Transaksi_rekening, User
} from "./model";
import multer from 'multer'
import path from 'path'
import jwt from "jsonwebtoken";
import {generateAccessToken} from "./jwt/util";

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

// HTTPS
var privateKey  = fs.readFileSync('ssl/privkey.pem', 'utf8');
var certificate = fs.readFileSync('ssl/cert.pem', 'utf8');

// JWT
const authenticateToken = (req, res, next)=>{
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401) // if there isn't any token

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async(err , userInfo) => {
        if (err) {
            console.log(err)
            return res.sendStatus(403)
        }

        if (req.originalUrl === "/api/transaksi/approve"){
            if (userInfo.role === "KASIR"){
                return res.sendStatus(403)
            }
        }
        req.user = userInfo
        console.log(userInfo)
        next() // pass the execution off to whatever request the client intended
    })
}

app.post("/api/login", (req, res)=>{
    if (typeof req.body.username === 'undefined' || typeof req.body.password === 'undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.login(req.body.username, req.body.password).then(async result=>{

        const token = generateAccessToken({
            user: req.body.username,
            role: result.role
        }, process.env.ACCESS_TOKEN_SECRET)
        res.status(200).send({
            success: true,
            auth: true,
            token: token,
            role: result.role,
            karyawan_id: result.karyawan_id,
            message: "Authentication success"
        })
    }).catch(err=>{
        if (err === "FALSE_AUTH"){
            res.status(200).send({
                success: true,
                auth: false,
                message: "Username or password incorrect"
            })
        }else{
            console.error(err)
            res.status(500).send({
                success: false,
                message: SOMETHING_WENT_WRONG
            })

        }
    })
})

app.get("/api/posisi/retrieve",(req,res)=>{
    if(typeof req.query.id_posisi==='undefined'){
        dao.retrievePosisi().then(result=>{
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
        dao.retrieveOnePosisi(new Posisi(req.query.id_posisi)).then(result=>{
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

app.post("/api/posisi/add",(req,res)=>{
    if(typeof req.body.nama_posisi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.addPosisi(new Posisi(null,req.body.nama_posisi)).then(result=>{
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

app.post("/api/posisi/update",(req,res)=>{
    if(typeof req.body.id_posisi==='undefined' ||
       typeof req.body.nama_posisi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.retrieveOnePosisi(new Posisi(req.body.id_posisi)).then(result=>{
        dao.updatePosisi(new Posisi(req.body.id_posisi,req.body.nama_posisi)).then(result=>{
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

app.delete("/api/posisi/delete",(req,res)=>{
    if(typeof req.query.id_posisi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.retrieveOnePosisi(new Posisi(req.query.id_posisi)).then(result=>{
        dao.deletePosisi(new Posisi(req.query.id_posisi)).then(result=>{
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

app.get("/api/role/retrieve",(req,res)=>{
    if(typeof req.query.id_role==='undefined'){
        dao.retrieveRole().then(result=>{
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
        dao.retrieveOneRole(new Role(req.query.id_role)).then(result=>{
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

app.post("/api/role/add",(req,res)=>{
    if(typeof req.body.nama_role==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.addRole(new Role(null,req.body.nama_role)).then(result=>{
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

app.post("/api/role/update",(req,res)=>{
    if(typeof req.body.id_role==='undefined' ||
       typeof req.body.nama_role==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.retrieveOneRole(new Role(req.body.id_role)).then(result=>{
        dao.updateRole(new Role(req.body.id_role,req.body.nama_role)).then(result=>{
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

app.delete("/api/role/delete",(req,res)=>{
    if(typeof req.query.id_role==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.retrieveOneRole(new Role(req.query.id_role)).then(result=>{
        dao.deleteRole(new Role(req.query.id_role)).then(result=>{
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

app.get("/api/karyawan/retrieve", (req,res)=>{
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
        const employee = new Karyawan(req.query.id_karyawan,null,null,null,null,null);

        dao.retrieveOneKaryawan(employee).then(async result => {
            const karyawanPerusahaan = new Karyawan_kerja_dimana(null, result[0].k_id_karyawan, null);

            try {
                const karyawanWithCabangRes = await dao.retrieveOneKaryawanKerjaDimana(karyawanPerusahaan);

                const cabangIds = karyawanWithCabangRes.map(karyawanWithCabang => karyawanWithCabang.id_cabang);

                const data = [{
                    ...result[0],
                    cabang_ids: cabangIds
                }]

                res.status(200).send({
                    success: true,
                    result: data
                })

            } catch(error) {
                if(error === NO_SUCH_CONTENT) {
                    const data = [{
                        ...result[0],
                        cabang_ids: []
                    }]
        
                    res.status(200).send({
                        success: true,
                        result: data
                    })
                } else {
                    console.error(error)
                    res.status(500).send({
                        success:false,
                        error:SOMETHING_WENT_WRONG
                    })
                }
            }
            
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

app.post("/api/karyawan/add", (req,res)=>{
    if(typeof req.body.nama_lengkap==='undefined' ||
        typeof req.body.posisi==='undefined' ||
        typeof req.body.nik==='undefined' ||
        typeof req.body.role==='undefined' ||
        typeof req.body.masih_hidup==='undefined' ||
        typeof req.body.cabang_ids==='undefined' ||
        typeof req.body.email==='undefined' ||
        typeof req.body.password==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(null,req.body.nama_lengkap.toUpperCase(),req.body.posisi.toUpperCase(), req.body.nik, req.body.role.toUpperCase(), req.body.masih_hidup)

    dao.addKaryawan(employee).then(async karyawanResult=>{
        dao.addKaryawan_kerja_dimana(new Karyawan_kerja_dimana(null,karyawanResult.k_id_karyawan,req.body.cabang_ids)).then(result=>{
            dao.registerUser(new User(null,karyawanResult.k_nama_lengkap,req.body.email,req.body.password,karyawanResult.k_role,karyawanResult.k_id_karyawan)).then(result=>{
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
            console.error(error)
            res.status(500).send({
                success:false,
                error:SOMETHING_WENT_WRONG
            })
        })
        /*
        const karyawanId = result.k_id_karyawan;

        const karyawanPerusahaanRes = req.body.cabang_ids.map(cabangId => {
            const karyawanPerusahaan = new Karyawan_kerja_dimana(null, karyawanId, cabangId);

            return dao.addKaryawan_kerja_dimana(karyawanPerusahaan)
        })

        const karyawanPerusahaanValues = await Promise.all(karyawanPerusahaanRes)
            .then(values => values)
            .catch(errors => console.error(errors));

        res.status(200).send({
            success:true,
            result:result
        })*/
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
        typeof req.body.masih_hidup==='undefined' ||
        typeof req.body.cabang_ids==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(req.body.id_karyawan, req.body.nama_lengkap.toUpperCase(), req.body.posisi.toUpperCase(), req.body.nik, req.body.role.toUpperCase(), req.body.masih_hidup.toUpperCase())

    dao.retrieveOneKaryawan(employee).then(async result=>{
        try {
            const updateKaryawanValues = await dao.updateKaryawan(employee)

            const { k_id_karyawan: karyawanId } = result[0];
            const karyawanWithCabang = new Karyawan_kerja_dimana(null, karyawanId, null);

            const upsertCabangIds = req.body.cabang_ids;
            let existingCabangIds = [];

            try {
                const karyawanKerjaDimana = await dao.retrieveOneKaryawanKerjaDimana(karyawanWithCabang);
                existingCabangIds = karyawanKerjaDimana.map(karyawanWithCabang => karyawanWithCabang.id_cabang);
            } catch(error) {
                console.log(error);
                if(error !== NO_SUCH_CONTENT) {
                    console.error(error)
                    res.status(500).send({
                        success:false,
                        error:SOMETHING_WENT_WRONG
                    })
                } 
            }

            const cabangIdsToAdd = upsertCabangIds.filter(cabangId => !existingCabangIds.includes(cabangId));
            const addKaryawanKerjaDimanaRes = cabangIdsToAdd.map(cabangId => 
                dao.addKaryawan_kerja_dimana(new Karyawan_kerja_dimana(null, karyawanId, cabangId))
            )

            const addKaryawanKerjaDimanaValues = await Promise.all(addKaryawanKerjaDimanaRes)
                .then(values => values)
                .catch(error => {
                    console.error(error);
                    res.status(500).send({
                        success:false,
                        error:SOMETHING_WENT_WRONG
                    });   
                })

            const cabangIdsToDelete = existingCabangIds.filter(cabangId => !upsertCabangIds.includes(cabangId));
            const deleteKaryawanKerjaDimanaRes = cabangIdsToDelete.map(cabangId => 
                dao.deleteKaryawanKerjaDimanaByKaryawanAndCabangIDs(new Karyawan_kerja_dimana(null, karyawanId, cabangId))
            )

            const deleteKaryawanKerjaDimanaValues = await Promise.all(deleteKaryawanKerjaDimanaRes)
                .then(values => values)
                .catch(error => {
                    console.error(error);
                    res.status(500).send({
                        success:false,
                        error:SOMETHING_WENT_WRONG
                    });
                })

            res.status(200).send({
                success: true
            })
        
        } catch(error) {
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
        }
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
    if(typeof req.query.id_perusahaan==='undefined' ||
       typeof req.body.nama_perusahaan==='undefined'){
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
    }else if(typeof req.query.id_perusahaan!=='undefined'){
        const perusahaan=new Perusahaan(req.query.id_perusahaan,null)

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
    }else {
        const perusahaan=new Perusahaan(null,req.body.nama_perusahaan)

        dao.retrievePerusahaanByName(perusahaan).then(result=>{
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

    dao.addPerusahaan(perusahaan,req.body.nama_bank,req.body.nomor_rekening,req.body.saldo).then(result=>{
        dao.addCabangPerusahaan(new Cabang_perusahaan(null,req.body.nama_cabang.toUpperCase(),result.p_id_perusahaan,req.body.lokasi,req.body.alamat_lengkap,true)).then(result=>{
            dao.addRekeningPerusahaan(req.body.nama_bank.toUpperCase(),req.body.nomor_rekening,req.body.saldo,result.cp_id_cabang,true).then(result=>{
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

    dao.addCabangPerusahaan(new Cabang_perusahaan(null,req.body.nama_cabang.toUpperCase(),req.body.perusahaan_id,req.body.lokasi,req.body.alamat_lengkap,null)).then(result=>{
        const cabangId=result.cp_id_cabang
        dao.unsetRekeningUtamaByPerusahaanId(req.body.perusahaan_id).then(result=>{
            dao.addRekeningPerusahaan(req.body.nama_bank,req.body.nomor_rekening,req.body.saldo,cabangId,true).then(result=>{
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
            }else if(error===NO_MAIN_AACOUNT){
                res.status(200).send({
                    success:true,
                    result:result
                })
            }
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
})

app.post("/api/cabang-perusahaan/set",(req,res)=>{
    if(typeof req.body.id_cabang==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.getCabangPerushaanId(new Cabang_perusahaan(req.body.id_cabang)).then(result=>{
        dao.getPerusahaanIdCabang(new Cabang_perusahaan(req.body.id_cabang)).then(result=>{
            dao.setDefaultCabangPerusahaan(new Cabang_perusahaan(req.body.id_cabang)).then(result=>{
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

    dao.getCabangPerushaanId(new Cabang_perusahaan(req.body.id_cabang)).then(result=>{
        dao.unsetDefaultCabangPerusahaan(new Cabang_perusahaan(req.body.id_cabang)).then(result=>{
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

    dao.retrieveOneCabangPerusahaan(new Cabang_perusahaan(req.body.id_cabang_perusahaan)).then(result=>{
        dao.addRekeningPerusahaan(req.body.nama_bank,req.body.nomor_rekening,req.body.saldo,req.body.id_cabang_perusahaan, null).then(result=>{
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
        typeof req.body.id_cabang_perusahaan==='undefined' ||
        typeof req.body.id_rekening==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const rekening=new Rekening_perusahaan(req.body.id_rekening,req.body.nama_bank,req.body.nomor_rekening,null,null,req.body.id_cabang_perusahaan)

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
    dao.getDefaultOrNonDefaultRekening(rekening).then(result=>{
        console.log(result[0].rp_rekening_utama)
        if(result[0].rp_rekening_utama===0){
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
        }else{
            res.status(204).send({
                success:false,
                error:NO_SUCH_CONTENT
            })
        }
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
            } else {
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
        } else{
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
        } else {
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
        } else {
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

const uploadFilter=(req,file,cb)=>{
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
    const upload=multer({storage:storage, fileFilter:uploadFilter}).array('attachment_transaksi',2)

    upload(req,res, async (error)=>{
        if(typeof req.body.is_rutin==='undefined' ||
            typeof req.body.bon_sementara==='undefined' ||
            typeof req.body.id_rekening==='undefined' ||
            typeof req.body.id_cabang_perusahaan==='undefined' ||
            typeof req.body.id_karyawan==='undefined'){
            res.status(400).send({
                success:false,
                error:WRONG_BODY_FORMAT
            })
            return
        }

        if (!req.files || (typeof req.files[0]==='undefined' && typeof req.files[1]==='undefined')) {

            const transfer=new Transaksi(null,'NOW','NOW',
                'NULL',req.body.is_rutin, 'Pending',req.body.bon_sementara, req.body.id_rekening,
                req.body.id_cabang_perusahaan,req.body.id_karyawan,'0',req.body.detail_transaksi,
                null,req.body.jumlah,req.body.id_kategori_transaksi,
                'No Attachment',req.body.debit_credit,req.body.nomor_bukti_transaksi,
                'No Attachment',req.body.pembebanan,'0')
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

            console.log(req.files && req.files[0].filename)
            console.log(req.files && req.files[1].filename)
            const transfer=new Transaksi(null,'NOW','NOW','NULL',req.body.is_rutin,'Pending',req.body.bon_sementara, req.body.id_rekening,
                req.body.id_cabang_perusahaan,req.body.id_karyawan,'0',req.body.detail_transaksi,null,req.body.jumlah,req.body.id_kategori_transaksi,
                req.files[0].filename,req.body.debit_credit,req.body.nomor_bukti_transaksi,
                req.files[1].filename,req.body.pembebanan,'0')

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

app.post("/api/transaksi/update",(req,res)=>{
    const upload=multer({storage:storage, fileFilter:uploadFilter}).array('attachment_transaksi',2)

    upload(req,res,async (error)=>{
        if(typeof req.body.is_rutin==='undefined' ||
            typeof req.body.bon_sementara==='undefined' ||
            typeof req.body.id_rekening==='undefined' ||
            typeof req.body.id_cabang==='undefined' ||
            typeof req.body.id_karyawan==='undefined' ||
            typeof req.body.id_transaksi==='undefined'){
            res.status(400).send({
                success:false,
                error:WRONG_BODY_FORMAT
            })
            return
        }

        if(typeof req.files[0]==='undefined' && typeof req.files[1]==='undefined'){

            const transfer=new Transaksi(req.body.id_transaksi,'NOW()','NOW()',null,
                req.body.is_rutin,'Modified',req.body.bon_sementara,req.body.id_rekening,req.body.id_cabang,req.body.id_karyawan,0,
                req.body.detail_transaksi,req.body.id_detil_transaksi,req.body.jumlah,req.body.id_kategori_transaksi,'No Attachment',
                req.body.debit_credit,req.body.nomor_bukti_transaksi,'No Attachment',req.body.skema_pembebanan_json,0)

            dao.retrieveOneTransaksi(new Transaksi(req.body.id_transaksi)).then(result=>{
                dao.getTransaksiFile(new Transaksi(req.body.id_transaksi)).then(result=>{
                    if(result[0]==='No Attachment' &&
                       result[1]==='No Attachment'){
                        dao.updateTransaksi(transfer).then(result=>{
                            res.status(200).send({
                                success:true,
                                result:result
                            })
                        }).catch(error=>{
                            if(error){
                                console.error(error)
                                res.status(500).send({
                                    success:false,
                                    error:SOMETHING_WENT_WRONG
                                })
                            }
                        })
                        return
                    }

                    fs.unlinkSync('./Uploads/'+result[0])
                    fs.unlinkSync('./Uploads/'+result[1])

                    dao.updateTransaksi(transfer).then(result=>{
                        res.status(200).send({
                            success:true,
                            result:result
                        })
                    }).catch(error=>{
                        if(error){
                            console.error(error)
                            res.status(500).send({
                                success:false,
                                error:SOMETHING_WENT_WRONG
                            })
                        }
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
        }else{
            if(error instanceof multer.MulterError){
                return res.send(error)
            } else if(error){
                return res.send(error)
            }

            const transfer=new Transaksi(req.body.id_transaksi,'NOW()','NOW()',null,
                req.body.is_rutin,'Modified',req.body.bon_sementara,req.body.id_rekening,req.body.id_cabang,req.body.id_karyawan,0,
                req.body.detail_transaksi,req.body.id_detil_transaksi,req.body.jumlah,req.body.id_kategori_transaksi,req.files[0].filename,
                req.body.debit_credit,req.body.nomor_bukti_transaksi,req.files[1].filename,req.body.skema_pembebanan_json,0)
            dao.retrieveOneTransaksi(new Transaksi(req.body.id_transaksi)).then(result=>{
                dao.getTransaksiFile(new Transaksi(req.body.id_transaksi)).then(result=>{
                    if(result[0]==='No Attachment' &&
                        result[1]==='No Attachment'){
                        dao.updateTransaksi(transfer).then(result=>{
                            res.status(200).send({
                                success:true,
                                result:result
                            })
                        }).catch(error=>{
                            if(error){
                                console.error(error)
                                res.status(500).send({
                                    success:false,
                                    error:SOMETHING_WENT_WRONG
                                })
                            }
                        })
                        return
                    }

                    fs.unlinkSync('./Uploads/'+result[0])
                    fs.unlinkSync('./Uploads/'+result[1])

                    dao.updateTransaksi(transfer).then(result=>{
                        res.status(200).send({
                            success:true,
                            result:result
                        })
                    }).catch(error=>{
                        if(error){
                            console.error(error)
                            res.status(500).send({
                                success:false,
                                error:SOMETHING_WENT_WRONG
                            })
                        }
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
        }
    })
})

//Don't forget to put authenticateToken after "/api/transaksi/approve" once ur done
app.post("/api/transaksi/approve", (req,res)=>{
    if(typeof req.body.id_transaksi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const transfer=new Transaksi(req.body.id_transaksi,null,null,null,null,null,null,null,null,
        null, null,null,null,null,null)

    dao.retrieveOneTransaksi(transfer).then(transaksiRetrieveResult=>{
        if (transaksiRetrieveResult.length === 0){
            res.status(204).send({
                success: false,
                error: NO_SUCH_CONTENT
            })
            return
        }

        const id_karyawan=transaksiRetrieveResult[0].id_karyawan
        const id_rekening=transaksiRetrieveResult[0].id_rekening
        const id_cabang=transaksiRetrieveResult[0].id_cabang
        const is_rutin=transaksiRetrieveResult[0].is_rutin
        const bon_sementara=transaksiRetrieveResult[0].bon_sementara
        dao.approveTransaksi(transfer).then(result=>{
            dao.retrieveDetilTransaksi(req.body.id_transaksi).then(detilTransaksiResult=>{
                let description=[]
                for(let i=0; i<detilTransaksiResult.length; i++){
                    description.push(new Detil_transaksi(
                        detilTransaksiResult[i].td_id_detil_transaksi,
                        detilTransaksiResult[i].td_id_transaksi,
                        detilTransaksiResult[i].td_jumlah,
                        detilTransaksiResult[i].td_id_kategori_transaksi,
                        detilTransaksiResult[i].td_bpu_attachment,
                        detilTransaksiResult[i].td_debit_credit,
                        detilTransaksiResult[i].td_nomor_bukti_transaksi,
                        detilTransaksiResult[i].td_file_bukti_transaksi,
                        detilTransaksiResult[i].skema_pembebanan_json,
                        detilTransaksiResult[i].td_is_deleted,
                        detilTransaksiResult[i].td_is_pembebanan_karyawan,
                        detilTransaksiResult[i].td_is_pembebanan_cabang
                    ))

                    const id_detil=detilTransaksiResult[i].td_id_detil_transaksi
                    const jumlah=detilTransaksiResult[i].td_jumlah
                    const id_kategori=detilTransaksiResult[i].td_id_kategori_transaksi
                    const attachment=detilTransaksiResult[i].td_bpu_attachment
                    const debit_credit=detilTransaksiResult[i].td_debit_credit
                    const nomor_bukti=detilTransaksiResult[i].td_nomor_bukti_transaksi
                    const file_bukti=detilTransaksiResult[i].td_file_bukti_transaksi
                    const pembebanan_karyawan=detilTransaksiResult[i].td_is_pembebanan_karyawan
                    const pembebanan_cabang=detilTransaksiResult[i].td_is_pembebanan_cabang
                    const skema_pembebanan=detilTransaksiResult[i].skema_pembebanan_json

                    const skema_pembebanan_obj=JSON.parse(skema_pembebanan)

                    if(detilTransaksiResult[i].td_debit_credit===0){
                        dao.debitSaldo(detilTransaksiResult[i].td_jumlah,id_rekening).then(result=>{
                            if(pembebanan_karyawan===1){ // if karyawan is being beban
                                for (let j=0; j<skema_pembebanan_obj.length; j++){
                                    // per object skema pembebanan, if 3 karyawan is being beban, loop will go 3 times
                                    if(id_karyawan!==skema_pembebanan_obj[j].karyawan_id){
                                        dao.addTransaksi(new Transaksi(
                                            null,null,null,null,
                                            is_rutin,'Approved', bon_sementara,id_rekening,id_cabang,id_karyawan,0,JSON.stringify(description),
                                            id_detil,jumlah,id_kategori, attachment,debit_credit,nomor_bukti, file_bukti,skema_pembebanan,0
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
                                    }else {
                                        res.status(200).send({
                                            success:true,
                                            result:result
                                        })
                                    }
                                }
                            }else if(pembebanan_cabang===1){ // is pembebanan to cabang
                                for(let j=0; j<skema_pembebanan_obj.length; j++){
                                    if(id_cabang!==skema_pembebanan_obj[j].cabang_id){
                                        dao.addTransaksi(new Transaksi(
                                            null,null,null,null,
                                            is_rutin,'Approved', bon_sementara,id_rekening,id_cabang,id_karyawan,0,JSON.stringify(description),
                                            id_detil,jumlah,id_kategori, attachment,debit_credit,nomor_bukti, file_bukti,skema_pembebanan,0
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
                                    }else {
                                        res.status(200).send({
                                            success:true,
                                            result:result
                                        })
                                    }
                                }
                            }
                        }).catch(error=>{
                            console.error(error)
                            res.status(500).send({
                                success:false,
                                error:SOMETHING_WENT_WRONG
                            })
                        })
                    }else if(detilTransaksiResult[i].td_debit_credit===1){
                        dao.creditSaldo(detilTransaksiResult[i].td_jumlah,id_rekening).then(result=>{
                            if(pembebanan_karyawan===1){
                                for(let j=0; j<skema_pembebanan_obj.length; j++){
                                    if(id_karyawan!==skema_pembebanan_obj[j].karyawan_id){
                                        dao.addTransaksi(new Transaksi(
                                            null,null,null,null,
                                            is_rutin,'Approved', bon_sementara,id_rekening,id_cabang,id_karyawan,0,JSON.stringify(description),
                                            id_detil,jumlah,id_kategori, attachment,debit_credit,nomor_bukti, file_bukti,skema_pembebanan,0
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
                                    }else {
                                        res.status(200).send({
                                            success:true,
                                            result:result
                                        })
                                    }
                                }
                            }else if(pembebanan_cabang===1){
                                for(let j=0; j<skema_pembebanan_obj.length; j++){
                                    if(id_cabang!==skema_pembebanan_obj[j].cabang_id){
                                        dao.addTransaksi(new Transaksi(
                                            null,null,null,null,
                                            is_rutin,'Approved', bon_sementara,id_rekening,id_cabang,id_karyawan,0,JSON.stringify(description),
                                            id_detil,jumlah,id_kategori, attachment,debit_credit,nomor_bukti, file_bukti,skema_pembebanan,0
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
                                    }else {
                                        res.status(200).send({
                                            success:true,
                                            result:result
                                        })
                                    }
                                }
                            }
                        }).catch(error=>{
                            console.error(error)
                            res.status(500).send({
                                success:false,
                                error:SOMETHING_WENT_WRONG
                            })
                        })
                    }

                }
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

    const transfer=new Transaksi(req.body.id_transaksi,null,null,null,null,null,null,null,null,
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

        if(result[0]==='No Attachment' && result[1]==='No Attachment'){
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
            return
        }
        fs.unlinkSync('./Uploads/'+result[0])
        fs.unlinkSync('./Uploads/'+result[1])

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
        } else {
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
        dao.getCabangPerushaanId(new Cabang_perusahaan(req.body.id_cabang,null,null,null,null,null)).then(result=>{
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
