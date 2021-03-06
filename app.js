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
    NO_SUCH_CONTENT,
    MISMATCH_OBJ_TYPE,
    MAIN_ACCOUNT_EXISTS,
    NO_MAIN_AACOUNT,
    TRANSACTION_NOT_PENDING,
    SUCCESS,
    ROLE_HAS_NO_ACCESS
} from "./strings";
import {
    Cabang_perusahaan,
    Detil_transaksi,
    Karyawan,
    Karyawan_kerja_dimana,
    Kategori_transaksi,
    Pembebanan,
    Perusahaan, Posisi, Role, Rekening_perusahaan,
    Transaksi, Transaksi_rekening, User, Feature
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

        // dao.getFeatureByRole(userInfo.role_id).then(result=>{
        //     for(let i=0;i<result.length;i++){
        //         if(req.originalUrl!=result[i].f_feature_name){
        //
        //             res.status(403).send({
        //                 success:false,
        //                 error:ROLE_HAS_NO_ACCESS
        //             })
        //         }else{
        //             req.user = userInfo
        //             console.log(userInfo)
        //             next() // pass the execution off to whatever request the client intended
        //         }
        //     }
        //
        // }).catch(error=>{
        //     if(error===NO_SUCH_CONTENT){
        //         res.status(204).send({
        //             success:false,
        //             error:NO_SUCH_CONTENT
        //         })
        //         return
        //     }
        //     console.error(error)
        //     res.status(500).send({
        //         success:false,
        //         error:SOMETHING_WENT_WRONG
        //     })
        // })

        let x=req.originalUrl
        let url
        let check=x.includes('?')
        if(check){
            let remove_after=x.indexOf('?')
            url=x.substring(0,remove_after)
        }else{
            url=x
        }

        dao.getOneFeatureByRole(url,userInfo.role_id).then(result=>{
            req.user = userInfo
            next() // pass the execution off to whatever request the client intended
        }).catch(error=>{
            if(error===ROLE_HAS_NO_ACCESS){
                res.status(403).send({
                    success:false,
                    error:ROLE_HAS_NO_ACCESS
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
}

app.post("/api/login", (req, res)=>{
    if (typeof req.body.username === 'undefined' || typeof req.body.password === 'undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.login(req.body.username, req.body.password).then(result=>{

        const token = generateAccessToken({
            user: req.body.username,
            role_id:result.id_role,
            role: result.role
        }, process.env.ACCESS_TOKEN_SECRET)

        res.status(200).send({
            success: true,
            auth: true,
            token: token,
            role: result.id_role,
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

app.get("/api/posisi/retrieve",authenticateToken,(req,res)=>{
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

app.post("/api/posisi/add",authenticateToken,(req,res)=>{
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

app.post("/api/posisi/update",authenticateToken,(req,res)=>{
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

app.delete("/api/posisi/delete",authenticateToken,(req,res)=>{
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

app.get("/api/role/retrieve",authenticateToken,(req,res)=>{
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

app.post("/api/role/add",authenticateToken,(req,res)=>{
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

app.post("/api/role/update",authenticateToken,(req,res)=>{
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

app.delete("/api/role/delete",authenticateToken,(req,res)=>{
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

app.get("/api/karyawan/retrieve",authenticateToken, (req,res)=>{
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

            const karyawanPerusahaan = new Karyawan_kerja_dimana(null, req.query.id_karyawan, null);

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

app.post("/api/karyawan/add",authenticateToken, (req,res)=>{
    if(typeof req.body.nama_lengkap==='undefined' ||
        typeof req.body.id_posisi==='undefined' ||
        typeof req.body.nik==='undefined' ||
        typeof req.body.id_role==='undefined' ||
        typeof req.body.masih_hidup==='undefined' ||
        typeof req.body.cabang_ids==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    req.body.superior = typeof req.body.superior == "undefined" ? null : req.body.superior;
    const employee=new Karyawan(null,req.body.nama_lengkap.toUpperCase(),req.body.id_posisi, req.body.nik, req.body.id_role, req.body.masih_hidup, req.body.superior)

    dao.retrieveOnePosisi(new Posisi(req.body.id_posisi)).then(result=>{
        dao.retrieveOneRole(new Role(req.body.id_role)).then(result=>{
            dao.addKaryawan(employee).then(async karyawanResult=>{
                dao.addKaryawan_kerja_dimana(new Karyawan_kerja_dimana(null,karyawanResult.k_id_karyawan,req.body.cabang_ids)).then(result=>{
                    if(typeof req.body.email!=='undefined' && typeof req.body.password !=='undefined'){
                        dao.registerUser(new User(null,karyawanResult.k_nama_lengkap,req.body.email,req.body.password,null,karyawanResult.k_id_role,karyawanResult.k_id_karyawan)).then(result=>{
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
                        res.status(200).send({
                            success:true,
                            result:karyawanResult
                        })
                    }
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

app.post("/api/karyawan/update",authenticateToken, (req,res)=>{
    if(typeof req.body.id_karyawan==='undefined' ||
        typeof req.body.nama_lengkap==='undefined' ||
        typeof req.body.id_posisi==='undefined' ||
        typeof req.body.nik==='undefined' ||
        typeof req.body.id_role==='undefined' ||
        typeof req.body.masih_hidup==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const employee=new Karyawan(req.body.id_karyawan, req.body.nama_lengkap.toUpperCase(), req.body.id_posisi, req.body.nik, req.body.id_role, req.body.masih_hidup.toUpperCase())

    dao.retrieveOneKaryawan(employee).then(employeeResult=>{
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
    // dao.retrieveOneKaryawan(employee).then(async result=>{
    //     try {
    //         const updateKaryawanValues = await dao.updateKaryawan(employee)
    //
    //         const { k_id_karyawan: karyawanId } = result[0];
    //         const karyawanWithCabang = new Karyawan_kerja_dimana(null, karyawanId, null);
    //
    //         const upsertCabangIds = req.body.cabang_ids;
    //         let existingCabangIds = [];
    //
    //         try {
    //             const karyawanKerjaDimana = await dao.retrieveOneKaryawanKerjaDimana(karyawanWithCabang);
    //             existingCabangIds = karyawanKerjaDimana.map(karyawanWithCabang => karyawanWithCabang.id_cabang);
    //         } catch(error) {
    //             console.log(error);
    //             if(error !== NO_SUCH_CONTENT) {
    //                 console.error(error)
    //                 res.status(500).send({
    //                     success:false,
    //                     error:SOMETHING_WENT_WRONG
    //                 })
    //             }
    //         }
    //
    //         const cabangIdsToAdd = upsertCabangIds.filter(cabangId => !existingCabangIds.includes(cabangId));
    //         const addKaryawanKerjaDimanaRes = cabangIdsToAdd.map(cabangId =>
    //             dao.addKaryawan_kerja_dimana(new Karyawan_kerja_dimana(null, karyawanId, cabangId))
    //         )
    //
    //         const addKaryawanKerjaDimanaValues = await Promise.all(addKaryawanKerjaDimanaRes)
    //             .then(values => values)
    //             .catch(error => {
    //                 console.error(error);
    //                 res.status(500).send({
    //                     success:false,
    //                     error:SOMETHING_WENT_WRONG
    //                 });
    //             })
    //
    //         const cabangIdsToDelete = existingCabangIds.filter(cabangId => !upsertCabangIds.includes(cabangId));
    //         const deleteKaryawanKerjaDimanaRes = cabangIdsToDelete.map(cabangId =>
    //             dao.deleteKaryawanKerjaDimanaByKaryawanAndCabangIDs(new Karyawan_kerja_dimana(null, karyawanId, cabangId))
    //         )
    //
    //         const deleteKaryawanKerjaDimanaValues = await Promise.all(deleteKaryawanKerjaDimanaRes)
    //             .then(values => values)
    //             .catch(error => {
    //                 console.error(error);
    //                 res.status(500).send({
    //                     success:false,
    //                     error:SOMETHING_WENT_WRONG
    //                 });
    //             })
    //
    //         res.status(200).send({
    //             success: true
    //         })
    //
    //     } catch(error) {
    //         if(error.code==='ER_DUP_ENTRY'){
    //             res.status(500).send({
    //                 success:false,
    //                 error:ERROR_DUPLICATE_ENTRY
    //             })
    //         } else{
    //             console.error(error)
    //             res.status(500).send({
    //                 success:false,
    //                 error:SOMETHING_WENT_WRONG
    //             })
    //         }
    //     }
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
})

app.delete("/api/karyawan/delete",authenticateToken, (req,res)=>{
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

app.get("/api/perusahaan/retrieve",authenticateToken,(req,res)=>{
    if(typeof req.query.id_perusahaan==='undefined' &&
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

app.post("/api/perusahaan/add",authenticateToken,(req,res)=>{
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

app.post("/api/perusahaan/update",authenticateToken, (req,res)=>{
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

app.delete("/api/perusahaan/delete",authenticateToken, (req,res)=>{
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

app.get("/api/cabang_perusahaan/retrieve",authenticateToken,(req,res)=>{
    if(typeof req.query.perusahaan_id==='undefined' &&
       typeof req.query.id_cabang==='undefined'){
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
    }else if(typeof req.query.perusahaan_id!=='undefined' &&
        typeof req.query.id_cabang==='undefined') {
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
    }else{
        dao.retrieveOneCabangPerusahaan(new Cabang_perusahaan(req.query.id_cabang)).then(result=>{
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

app.post("/api/cabang-perusahaan/add",authenticateToken,(req,res)=>{
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
        dao.unsetRekeningUtamaByPerusahaanId(cabangId).then(result=>{
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

app.post("/api/cabang-perusahaan/set",authenticateToken,(req,res)=>{
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

app.post("/api/cabang-perusahaan/unset",authenticateToken,(req,res)=>{
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

app.post("/api/cabang-perushaan/update",authenticateToken,(req,res)=>{
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

app.delete("/api/cabang-perusahaan/delete",authenticateToken,(req,res)=>{
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

app.get("/api/rekening-perusahaan/retrieve",authenticateToken,(req,res)=>{
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

app.post("/api/rekening-perusahaan/add",authenticateToken,(req,res)=>{
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

app.post("/api/rekening-perusahaan/update",authenticateToken,(req,res)=>{
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

app.delete("/api/rekening-perusahaan/delete",authenticateToken,(req,res)=>{
    if(typeof req.query.id_rekening==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const rekening=new Rekening_perusahaan(req.query.id_rekening,null,null,null,null)
    dao.getDefaultOrNonDefaultRekening(rekening).then(result=>{
        if(result===0){
            dao.deleteRekeningPerusahaan(rekening).then(result=>{
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

app.post("/api/rekening-utama/set",authenticateToken,(req,res)=>{
    if(typeof req.body.id_rekening==='undefined' ||
        typeof req.body.id_cabang_perusahaan==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.getRekeningUtama(req.body.id_cabang_perusahaan).then(rekeningResult=>{
        dao.getRekeningNonUtama(req.body.id_cabang_perusahaan).then(result=>{
            dao.setRekeningUtama(req.body.id_rekening).then(result=>{
                dao.unsetRekeningUtama(rekeningResult).then(result=>{
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
    }).catch(error=>{
        console.error(error)
        res.status(500).send({
            success:false,
            error:SOMETHING_WENT_WRONG
        })
    })
})

app.post("/api/rekening-utama/unset",authenticateToken, (req,res)=>{
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

app.get("/api/transaksi-rekening/retrieve",authenticateToken,(req,res)=>{
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

app.post("/api/transaksi-rekening/add",authenticateToken,(req,res)=>{
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

app.post("/api/transaksi-rekening/update",authenticateToken,(req,res)=>{
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

app.delete("/api/transaksi-rekening/delete",authenticateToken,(req,res)=>{
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

app.get("/api/kategori-transaksi/retrieve",authenticateToken,(req,res)=>{
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

app.post("/api/kategori-transaksi/add",authenticateToken,(req,res)=>{
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

app.post("/api/kategori-transaksi/update",authenticateToken, (req,res)=>{
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

app.delete("/api/kategori-transaksi/delete",authenticateToken, (req,res)=>{
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

app.get("/api/transaksi/retrieve",authenticateToken,(req,res)=>{
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
            const date=result[0].tanggal_transaksi

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

app.post("/api/transaksi/add",authenticateToken,async(req,res)=> {
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

            dao.addTransaksi(transfer).then(transaksiResult=>{
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

app.post("/api/transaksi/update",authenticateToken,(req,res)=>{
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
app.post("/api/transaksi/approve", authenticateToken, (req,res)=>{
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

                    if(pembebanan_karyawan===1){
                        if(debit_credit===0){
                            for(let j=0; j<skema_pembebanan_obj.length; j++){
                                for(let k=0; k<skema_pembebanan_obj[j].pembebanan.length; k++){
                                    dao.debitSaldo(skema_pembebanan_obj[j].pembebanan[k].jumlah,id_rekening).then(result=>{
                                        if(id_karyawan !== skema_pembebanan_obj[j].pembebanan[k].karyawan_id){
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
                                        }else{
                                            res.status(200).send({
                                                success:true,
                                                result:result
                                            })
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
                        }else if(debit_credit===1){
                            for(let j=0; j<skema_pembebanan_obj.length; j++){
                                for(let k=0; k<skema_pembebanan_obj[j].pembebanan.length; k++){
                                    dao.creditSaldo(skema_pembebanan_obj[j].pembebanan[k].jumlah,id_rekening).then(result=>{
                                        if(id_karyawan !== skema_pembebanan_obj[j].pembebanan[k].karyawan_id){
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
                                        }else{
                                            res.status(200).send({
                                                success:true,
                                                result:result
                                            })
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
                        }
                    }else if(pembebanan_cabang===1){
                        if(debit_credit===0){
                            for(let j=0; j<skema_pembebanan_obj.length; j++){
                                for(let k=0; k<skema_pembebanan_obj[j].pembebanan.length; k++){
                                    dao.debitSaldo(skema_pembebanan_obj[j].pembebanan[k].jumlah,id_rekening).then(result=>{
                                        if(id_cabang !== skema_pembebanan_obj[j].pembebanan[k].cabang_id){
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
                                        }else{
                                            res.status(200).send({
                                                success:true,
                                                result:result
                                            })
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
                        }else if(debit_credit===1){
                            for(let j=0; j<skema_pembebanan_obj.length; j++){
                                for(let k=0; k<skema_pembebanan_obj[j].pembebanan; k++){
                                    dao.creditSaldo(skema_pembebanan_obj[j].pembebanan[k].jumlah,id_rekening).then(result=>{
                                        if(id_cabang !== skema_pembebanan_obj[j].pembebanan[k].cabang_id){
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
                                        }else{
                                            res.status(200).send({
                                                success:true,
                                                result:result
                                            })
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

app.post("/api/transaksi/reject",authenticateToken,(req,res)=>{
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

app.post("/api/transaksi/cancel",authenticateToken,(req,res)=>{
    if(typeof req.query.id_transaksi==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.getTransaksiID(new Transaksi(req.query.id_transaksi)).then(result=>{
        dao.cancelTransaksi(new Transaksi(req.query.id_transaksi)).then(result=>{
            res.status(200).send({
                success:true,
                result:result
            })
        }).catch(error=>{
            if(error===TRANSACTION_NOT_PENDING){
                res.status(204).send({
                    success:false,
                    error:TRANSACTION_NOT_PENDING
                })
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

app.delete("/api/transaksi/delete",authenticateToken, (req,res)=>{
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

app.get("/api/karyawan-kerja-dimana/retrieve",authenticateToken,(req,res)=>{
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

app.post("/api/karyawan-kerja-dimana/add",authenticateToken,(req,res)=>{
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

app.post("/api/karyawan-kerja-dimana/update",authenticateToken, (req,res)=>{
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

app.delete("/api/karyawan-kerja-dimana/delete",authenticateToken,(req,res)=>{
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

app.get("/api/feature-list/view",authenticateToken,(req,res)=>{
    if(typeof req.query.id==='undefined'){
        dao.retrieveFeatures().then(result=>{
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
        dao.retrieveOneFeature(new Feature(req.query.id)).then(result=>{
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

app.post("/api/feature-list/add",authenticateToken,(req,res)=>{
    if(typeof req.body.feature_name==='undefined' ||
        typeof req.body.pretty_name==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.addFeature(new Feature(null,req.body.pretty_name,req.body.feature_name)).then(result=>{
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

app.post("/api/feature-list/update",authenticateToken,(req,res)=>{
    if(typeof req.body.feature_name==='undefined' ||
        typeof req.body.pretty_name==='undefined' ||
        typeof req.body.id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.deleteFeature(new Feature(req.body.id)).then(result=>{
        dao.addFeature(new Feature(null,req.body.pretty_name,req.body.feature_name,req.body.role_id)).then(result=>{
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
        if(error.code==='ER_NO_REFERENCED_ROW_2'){
            res.status(204).send({
                success:false,
                error:ERROR_FOREIGN_KEY
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

app.delete("/api/feature-list/delete",authenticateToken,(req,res)=>{
    if(typeof req.query.id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    dao.retrieveOneFeature(new Feature(req.query.id)).then(result=>{
        dao.deleteFeature(new Feature(req.query.id)).then(result=>{
            res.status(200).send({
                success:true,
                result:SUCCESS
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

app.get('/api/access-control/get',authenticateToken, async (req, res) => {
    const roleID = req.query.role_id;

    if(!roleID) {
        return res.status(400).send({
            success: false,
            error: WRONG_BODY_FORMAT
        })
    }

    const result = await dao.getFeatureByRole(roleID);

    return res.status(200).send({
        success: true,
        result,
    })
})

app.post('/api/access-control/set',authenticateToken,(req,res)=>{
    if(typeof req.body.role_id==='undefined' ||
       typeof req.body.feature_id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const featureIds=req.body.feature_id

    for(let i=0;i<featureIds.length;i++){
        dao.bindFeatureToRole(req.body.role_id,featureIds[i],1).then(result=>{
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

app.post('/api/access-control/update',authenticateToken,(req,res)=>{
    if(typeof req.body.role_id==='undefined' ||
       typeof req.body.feature_id==='undefined'){
        res.status(400).send({
            success:false,
            error:WRONG_BODY_FORMAT
        })
        return
    }

    const featureIds=req.body.feature_id

    for(let i=0;i<featureIds.length;i++){
        dao.updateRoleHaveFeature(req.body.role_id,featureIds[i]).then(result=>{
            res.status(200).send({
                success:true,
                result:SUCCESS
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

app.listen(PORT, ()=>{
    console.info(`Server serving port ${PORT}`)
})

const httpsServe = https.createServer({
    key: privateKey,
    cert: certificate
},app);

httpsServe.listen(8089);
