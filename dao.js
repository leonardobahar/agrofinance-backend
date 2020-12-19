import mysqlConn from './mysql-conn'
import fs from 'fs'
import {
    ADMIN_VALIDATED,
    ALL, CANCELLED, DUPLICATE_ENTRY, ERROR_DUPLICATE_ENTRY, INVALID, INVALID_FINAL, MAIN_ACCOUNT_EXISTS,
    MISMATCH_OBJ_TYPE,
    NO_AFFECTED_ROWS, NO_MAIN_AACOUNT,
    NO_SUCH_CONTENT,
    ONLY_WITH_VENDORS, ORDER_PROCESSING,
    SOMETHING_WENT_WRONG, SUCCESS, VALID, WRONG_BODY_FORMAT
} from "./strings"
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

export class Dao{
    constructor(host, user, password, dbname) {
        this._host=host
        this._user=user
        this._password=password
        this._dbname=dbname

        this._initSqlStmt = fs.readFileSync("agrofinance.sql").toString()

        const handleConnection=()=>{
            return new Promise(resolve => {
                this.mysqlConn = new mysqlConn(
                    this._host,
                    this._user,
                    this._password,
                    this._dbname
                )

                this.mysqlConn.connect(err=>{
                    if(err){
                        console.error('error when connecting to db:', err)
                        setTimeout(handleConnection, 2000)
                    }else{
                        this.mysqlConn.query(this._initSqlStmt, (err, res, fields)=>{
                            if(err){
                                throw err
                            }else {
                                console.log("CONNECTED SUCCESSFULLY TO DATABASE")
                                resolve(1)
                            }
                        })
                    }
                })

                this.mysqlConn.on('error', (err)=>{
                    console.log('db error', err)
                    if(err.code === 'PROTOCOL_CONNECTION_LOST'){
                        handleConnection()
                    }else {
                        console.error(err)
                        handleConnection()
                    }
                })
            })
        }

        handleConnection()
    }

    login(username, password){
        return new Promise((resolve, reject)=>{
            const query = "SELECT * FROM `user` WHERE `username` = ? AND `password` = ?"
            this.mysqlConn.query(query, (error, result)=>{
                if (error){
                    reject(error)
                    return
                }
            })
        })
    }

    retrieveKaryawan(){
        return new Promise((resolve, reject)=>{
            const query="SELECT * FROM karyawan "
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const employees=result.map(rowDataPacket=>{
                    return{
                        id:rowDataPacket.k_id_karyawan,
                        nama_lengkap:rowDataPacket.k_nama_lengkap,
                        posisi:rowDataPacket.k_posisi,
                        nik:rowDataPacket.k_nik,
                        role:rowDataPacket.k_role,
                        masih_hidup:rowDataPacket.k_masih_hidup
                    }
                })
                resolve(employees)
            })
        })
    }

    retrieveOneKaryawan(karyawan){
        return new Promise((resolve, reject)=>{
            if(!karyawan instanceof Karyawan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT * FROM karyawan WHERE k_id_karyawan=?"
            this.mysqlConn.query(query, karyawan.k_id_karyawan, async(error, result)=>{
                if(error){
                    reject(error)
                    return
                } else if(result.length>0){
                    let employees=[]
                    for(let i=0; i<result.length; i++){
                        employees.push(new Karyawan(
                            result[i].k_id_karyawan,
                            result[i].k_nama_lengkap,
                            result[i].k_posisi,
                            result[i].k_nik,
                            result[i].k_role,
                            result[i].k_masih_hidup
                        ))
                    }
                    resolve(employees)
                } else {
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    addKaryawan(karyawan){
        return new Promise((resolve,reject)=>{
            if(!karyawan instanceof Karyawan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="INSERT INTO `karyawan` (`k_nama_lengkap`,`k_posisi`, `k_nik`, `k_role`, `k_masih_hidup`) VALUES(?,?,?,?,?)"
            this.mysqlConn.query(query, [karyawan.k_nama_lengkap, karyawan.k_posisi, karyawan.k_nik, karyawan.k_role, karyawan.k_masih_hidup], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                karyawan.k_id_karyawan=result.insertId
                resolve(karyawan)

            })
        })
    }

    updateKaryawan(karyawan){
        return new Promise((resolve,reject)=>{
            if(!karyawan instanceof Karyawan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE karyawan SET k_nama_lengkap=?, k_posisi=?, k_nik=?, k_role=?, k_masih_hidup=? WHERE k_id_karyawan=?"
            this.mysqlConn.query(query, [karyawan.k_nama_lengkap, karyawan.k_posisi, karyawan.k_nik,karyawan.k_role, karyawan.k_masih_hidup, karyawan.k_id_karyawan], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                karyawan.k_id_karyawan=result.k_id_karyawan
                resolve(karyawan)
            })
        })
    }

    deleteKaryawan(karyawan){
        return new Promise((resolve,reject)=>{
            if(!karyawan instanceof Karyawan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="DELETE FROM karyawan WHERE k_id_karyawan=?"
            this.mysqlConn.query(query,karyawan.k_id_karyawan,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                karyawan.k_id_karyawan=result.k_id_karyawan
                resolve(karyawan)
            })
        })
    }

    retrievePerusahaan(){
        return new Promise((resolve, reject)=>{
            const query=`SELECT p.p_id_perusahaan, p.p_nama_perusahaan, cp.cp_id_cabang, cp.cp_nama_cabang, cp.cp_lokasi, cp.cp_alamat_lengkap, cp.cp_is_default,
                rp.rp_id_rekening, rp.rp_nama_bank, rp.rp_nomor_rekening, rp.rp_saldo, rp.rp_rekening_utama
                FROM perusahaan p LEFT OUTER JOIN cabang_perusahaan cp ON cp.cp_perusahaan_id=p.p_id_perusahaan
                LEFT OUTER JOIN rekening_perusahaan rp ON rp.rp_id_cabang_perusahaan=cp.cp_id_cabang;`
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const companies=result.map(rowDataPacket=>{
                    return{
                        id:rowDataPacket.p_id_perusahaan,
                        nama_perusahaan:rowDataPacket.p_nama_perusahaan,
                        id_cabang:rowDataPacket.cp_id_cabang,
                        nama_cabang:rowDataPacket.cp_nama_cabang,
                        lokasi:rowDataPacket.cp_lokasi,
                        alamat_lengkap:rowDataPacket.cp_alamat_lengkap,
                        id_rekening:rowDataPacket.rp_id_rekening,
                        nama_bank:rowDataPacket.rp_nama_bank,
                        nomor_rekening:rowDataPacket.rp_nomor_rekening,
                        saldo:rowDataPacket.rp_saldo,
                        rekening_utama:rowDataPacket.rp_rekening_utama,
                        default_cabang: rowDataPacket.cp_is_default
                    }
                })
                resolve(companies)
            })
        })
    }

    retrieveOnePerusahaan(perusahaan){
        return new Promise((resolve, reject)=>{
            if(!perusahaan instanceof Perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query=`SELECT * FROM perusahaan WHERE p_id_perusahaan=? `
            this.mysqlConn.query(query, perusahaan.p_id_perusahaan, async (error, result)=>{
                if(error){
                    reject(error)
                    return
                } else if(result.length>0){
                    let companies=[]
                    for(let i=0;i<result.length;i++){
                        companies.push(new Perusahaan(
                            result[i].p_id_perusahaan,
                            result[i].p_nama_perusahaan
                        ), await this.retrieveCabangPerusahaanByPerusahaanId(result[i].p_id_perusahaan).catch(error=>{
                            reject(error)
                        }))
                    }
                    resolve(companies)
                } else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    addPerusahaan(perusahaan){
        return new Promise((resolve,reject)=>{
            if(!perusahaan instanceof Perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="INSERT INTO `perusahaan` (`p_nama_perusahaan`) VALUES(?)"
            this.mysqlConn.query(query, [perusahaan.p_nama_perusahaan], async(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                perusahaan.p_id_perusahaan=result.insertId
                resolve(perusahaan)
            })
        })
    }

    updatePerusahaan(perusahaan){
        return new Promise((resolve,reject)=>{
            if(!perusahaan instanceof Perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE perusahaan SET p_nama_perusahaan=?, WHERE p_id_perusahaan=?"
            this.mysqlConn.query(query, [perusahaan.p_nama_perusahaan, perusahaan.p_id_perusahaan], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                perusahaan.p_id_perusahaan=result.p_id_perusahaan
                resolve(perusahaan)
            })
        })
    }

    deletePerusahaan(perusahaan){
        return new Promise((resolve,reject)=>{
            if(!perusahaan instanceof Perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="DELETE FROM perusahaan WHERE p_id_perusahaan=?"
            this.mysqlConn.query(query,perusahaan.p_id_perusahaan,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                perusahaan.p_id_perusahaan=result.p_id_perusahaan
                resolve(perusahaan)
            })
        })
    }

    retrieveCabangPerusahaan(){
        return new Promise((resolve,reject)=>{
            const query="SELECT cp.cp_id_cabang, cp.cp_nama_cabang, cp.cp_perusahaan_id, p.p_nama_perusahaan, cp.cp_lokasi, cp.cp_alamat_lengkap, cp.cp_is_default "+
                "FROM cabang_perusahaan cp LEFT OUTER JOIN perusahaan p ON cp.cp_perusahaan_id=p.p_id_perusahaan"
            this.mysqlConn.query(query, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                const cabang=result.map(rowDataPcket=>{
                    return{
                        id_cabang:rowDataPcket.cp_id_cabang,
                        nama_cabang:rowDataPcket.cp_nama_cabang,
                        perusahaan_id:rowDataPcket.cp_perusahaan_id,
                        lokasi:rowDataPcket.cp_lokasi,
                        alamat_lengkap:rowDataPcket.cp_alamat_lengkap,
                        default:rowDataPcket.cp_is_default
                    }
                })
                resolve(cabang)
            })
        })
    }

    retrieveOneCabangPerusahaan(cabang){
        return new Promise((resolve,reject)=>{
            if(!cabang instanceof Cabang_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }
            const query="SELECT * FROM cabang_perusahaan WHERE cp_id_cabang=? "
            this.mysqlConn.query(query,cabang.cp_id_cabang,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    let branches=[]
                    for(let i=0; i<result.length; i++){
                        branches.push(new Cabang_perusahaan(
                            result[i].cp_id_cabang,
                            result[i].cp_nama_cabang,
                            result[i].cp_perusahaan_id,
                            result[i].cp_lokasi,
                            result[i].cp_alamat_lengkap,
                            result[i].cp_is_default
                        ))
                    }
                    resolve(branches)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    retrieveCabangPerusahaanByPerusahaanId(perusahaan_id){
        return new Promise((resolve,reject)=>{
            const query="SELECT * FROM cabang_perusahaan WHERE cp_perusahaan_id=? "
            this.mysqlConn.query(query, perusahaan_id, async (error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    let cabang=[]
                    for(let i=0; i<result.length; i++){
                        cabang.push(new Cabang_perusahaan(
                            result[i].cp_id_cabang,
                            result[i].cp_nama_cabang,
                            result[i].cp_perusahaan_id,
                            result[i].cp_lokasi,
                            result[i].cp_alamat_lengkap,
                            result[i].cp_is_default
                        ),await this.getRekeningPerusahaanByCabangId(result[i].cp_id_cabang).catch(error=>{
                            reject(error)
                        }))
                    }
                    resolve(cabang)
                }else {
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    getCabangPerushaanId(cabang){
        return new Promise((resolve,reject)=>{
            if(!cabang instanceof Cabang_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT cp_id_cabang FROM cabang_perusahaan WHERE cp_id_cabang=?"
            this.mysqlConn.query(query, cabang.cp_id_cabang, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    resolve(result[0].cp_id_cabang)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    getPerusahaanIdCabang(cabang){
        return new Promise((resolve,reject)=>{
            if(!cabang instanceof Cabang_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT cp_perusahaan_id FROM cabang_perusahaan WHERE cp_id_cabang=?"
            this.mysqlConn.query(query, cabang.cp_id_cabang, async (error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    await this.unsetDefaultCabangPerusahaanWithPerusahaanId(result[0].cp_perusahaan_id)
                    resolve(result[0].cp_perusahaan_id)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    addCabangPerusahaan(cabang){
        return new Promise(async(resolve,reject)=>{
            if(!cabang instanceof Cabang_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            if (typeof cabang.cp_is_default === 'undefined' || cabang.cp_is_default === null){
                cabang.cp_is_default=0
            }

            if(cabang.cp_is_default===true){
                cabang.cp_is_default===1
            }

            const query="INSERT INTO cabang_perusahaan (`cp_nama_cabang`, `cp_perusahaan_id`, `cp_lokasi`, `cp_alamat_lengkap`, `cp_is_default`) "+
                "VALUES(?,?,?,?,?)"
            this.mysqlConn.query(query, [cabang.cp_nama_cabang, cabang.cp_perusahaan_id, cabang.cp_lokasi, cabang.cp_alamat_lengkap, cabang.cp_is_default], async(error,result)=>{
                if(error){
                    reject(error)
                    return
                }
                cabang.cp_id_cabang=result.insertId
                resolve(cabang)
            })

        })
    }

    updateCabangPerusahaan(cabang){
        return new Promise((resolve,reject)=>{
            if(!cabang instanceof Cabang_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE cabang_perusahaan SET cp_nama_cabang=?, cp_perusahaan_id=?, cp_lokasi=?, cp_alamat_lengkap=? "+
                "WHERE cp_id_cabang=?"
            this.mysqlConn.query(query, [cabang.cp_nama_cabang, cabang.cp_perusahaan_id, cabang.cp_lokasi, cabang.cp_alamat_lengkap, cabang.cp_id_cabang], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(cabang)
            })
        })
    }

    getDefaultCabangPerusahaan(id_perusahaan){
        return new Promise((resolve,reject)=>{
            const query="SELECT cp_is_default FROM cabang_perusahaan WHERE cp_is_default=1 AND cp_perusahaan_id=?"
            this.mysqlConn.query(query,[id_perusahaan],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                for(let i=0; i<result.length; i++){
                    if(result[i].cp_is_default===1){
                        resolve(result[i].cp_is_default)
                    }else if(result[i].cp_is_default===0){
                        reject(NO_MAIN_AACOUNT)
                    }else{
                        reject(NO_SUCH_CONTENT)
                    }
                }
            })
        })
    }

    getNonDefaultCabangPerusahaan(id_cabang){
        return new Promise((resolve,reject)=>{
            const query="SELECT cp_is_default FROM cabang_perusahaan WHERE cp_is_default=0 AND cp_id_cabang=?"
            this.mysqlConn.query(query,id_cabang,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                for(let i=0; i<result.length; i++){
                    if(result[i].cp_is_default===0){
                        resolve(result[i].cp_is_default)
                    }else if(result[i].cp_is_default===1){
                        reject(MAIN_ACCOUNT_EXISTS)
                    }else{
                        reject(NO_SUCH_CONTENT)
                    }
                }
            })
        })
    }

    setDefaultCabangPerusahaan(cabang){
        return new Promise((resolve,reject)=>{
            if(!cabang instanceof Cabang_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE cabang_perusahaan SET cp_is_default=1 WHERE cp_id_cabang=?"
            this.mysqlConn.query(query, [cabang.cp_id_cabang], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(SUCCESS)
            })
        })
    }

    unsetDefaultCabangPerusahaan(cabang){
        return new Promise((resolve,reject)=>{
            if(!cabang instanceof Cabang_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE cabang_perusahaan SET cp_is_default=0 WHERE cp_id_cabang=?"
            this.mysqlConn.query(query, [cabang.cp_id_cabang], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(SUCCESS)
            })
        })
    }

    unsetDefaultCabangPerusahaanWithPerusahaanId(id_perusahaan){
        return new Promise((resolve,reject)=>{
            const query="UPDATE cabang_perusahaan SET cp_is_default=0 WHERE cp_is_default=1 AND cp_perusahaan_id=?"
            this.mysqlConn.query(query, id_perusahaan, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(SUCCESS)
            })
        })
    }

    deleteCabangPerusahaan(cabang){
        return new Promise((resolve,reject)=>{
            if(!cabang instanceof Cabang_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="DELETE FROM cabang_perusahaan WHERE cp_id_cabang=?"
            this.mysqlConn.query(query, cabang.cp_id_cabang, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(cabang)
            })
        })
    }

    retrieveRekeningPerusahaan(){
        return new Promise((resolve,reject)=>{
            const query="SELECT rp.rp_nama_bank, rp.rp_nomor_rekening, rp.rp_saldo, rp.rp_rekening_utama, rp.rp_id_cabang_perusahaan, cp.cp_nama_cabang "+
                "FROM rekening_perusahaan rp LEFT OUTER JOIN cabang_perusahaan cp ON rp.rp_id_cabang_perusahaan=cp.cp_id_cabang "
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const rekening=result.map(rowDataPacket=>{
                    return{
                        id_rekening:rowDataPacket.rp_id_rekening,
                        nama_bank:rowDataPacket.rp_nama_bank,
                        nomor_rekening:rowDataPacket.rp_nomor_rekening,
                        saldo:rowDataPacket.rp_saldo,
                        rekening_utama:rowDataPacket.rp_rekening_utama,
                        id_cabang:rowDataPacket.rp_id_cabang_perusahaan,
                        nama_cabang:rowDataPacket.cp_nama_cabang
                    }
                })

                resolve(rekening)
            })
        })
    }

    retrieveOneRekeningPerusahaan(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT rp.rp_nama_bank, rp.rp_nomor_rekening, rp.rp_saldo, rp.rp_rekenig_utama, rp.rp_id_cabang_perusahaan, cp.cp_nama_cabang"+
                "FROM rekening_perusahaan rp LEFT OUTER JOIN cabang_perusahaan cp ON rp.rp_id_cabang_perusahaan=cp.cp_id_cabang "+
                "WHERE rp.rp_id_cabang_perusahaan=?"
            this.mysqlConn.query(query, rekening.rp_id_cabang_perusahaan, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    const rekening=result.map(rowDataPacket=>{
                        return{
                            id_rekening:rowDataPacket.rp_id_rekening,
                            nama_bank:rowDataPacket.rp_nama_bank,
                            nomor_rekening:rowDataPacket.rp_nomor_rekening,
                            saldo:rowDataPacket.rp_saldo,
                            rekening_utama:rowDataPacket.rp_rekening_utama,
                            id_cabang:rowDataPacket.cp_id_cabang,
                            nama_cabang:rowDataPacket.cp_nama_cabang
                        }
                    })
                    resolve(rekening)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    getRekeningPerusahaanByCabangId(id_cabang_perusahaan){
        return new Promise((resolve,reject)=>{
            const query="SELECT * FROM rekening_perusahaan WHERE rp_rekening_utama=1 AND rp_id_cabang_perusahaan=?"
            this.mysqlConn.query(query,id_cabang_perusahaan,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    let rekening=[]
                    for(let i=0; i<result.length; i++){
                        rekening.push(new Rekening_perusahaan(
                            result[i].rp_id_rekening,
                            result[i].rp_nama_bank,
                            result[i].rp_nomor_rekening,
                            result[i].rp_saldo,
                            result[i].rp_rekening_utama,
                            result[i].rp_id_cabang_perusahaan
                        ))
                    }
                    resolve(rekening)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    getRekeningPerusahanId(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT rp_id_rekening FROM rekening_perusahaan WHERE rp_id_rekening=?"
            this.mysqlConn.query(query,rekening.rp_id_rekening,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    resolve(result[0].rp_id_rekening)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    getDefaultOrNonDefaultRekening(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT rp_rekening_utama FROM rekening_perusahaan WHERE rp_id_rekening=?"
            this.mysqlConn.query(query,rekening.rp_id_rekening,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    resolve(result[0].rp_rekening_utama)
                }else{
                    reject(NO_MAIN_AACOUNT)
                }
            })
        })
    }

    addRekeningPerusahaan(nama_bank, nomor_rekening, saldo, id_cabang_perusahaan, is_rekening_utama){
        return new Promise((resolve,reject)=>{
            if (typeof is_rekening_utama === 'undefined' || is_rekening_utama === null){
                is_rekening_utama = 0
            }else if(is_rekening_utama === true){
                is_rekening_utama=1
            }

            const query="INSERT INTO `rekening_perusahaan` (`rp_nama_bank`, `rp_nomor_rekening`, `rp_saldo`, `rp_rekening_utama`, `rp_id_cabang_perusahaan`) VALUES(?, ?, ?, ?, ?)"
            this.mysqlConn.query(query,[nama_bank, nomor_rekening, saldo, is_rekening_utama, id_cabang_perusahaan],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(SUCCESS)
            })
        })
    }

    updateRekeningPerusahaan(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE rekening_perusahaan SET rp_nama_bank=?, rp_nomor_rekening=?, rp_rekening_utama=?, rp_id_cabang_perusahaan=? "+
                "WHERE rp_id_rekening=?"

            this.mysqlConn.query(query, [rekening.rp_nama_bank, rekening.rp_nomor_rekening, rekening.rp_rekening_utama, rekening.rp_id_cabang_perusahaan, rekening.rp_id_rekening],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                rekening.rp_id_rekening=result.insertId
                resolve(rekening)
            })
        })
    }

    deleteRekeningPerusahaan(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="DELETE FROM rekening_perusahaan WHERE rp_id_rekening=? "
            this.mysqlConn.query(query,rekening.rp_id_rekening,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                rekening.rp_id_rekening=result.insertId
                resolve(rekening)
            })
        })
    }

    retrieveRekeningUtama(){
        return new Promise((resolve,reject)=>{
            const query="SELECT rp.rp_id_rekening, rp.rp_nama_bank, rp.rp_nomor_rekening, rp.rp_saldo, rp.rp_rekening_utama, rp.rp_id_cabang_perusahaan, cp.cp_nama_cabang "+
                "FROM rekening_perusahaan rp LEFT OUTER JOIN cabang_perusahaan cp ON rp.rp_id_cabang_perusahaan=cp.cp_id_cabang "+
                "WHERE rp.rp_rekening_utama=1"
            this.mysqlConn.query(query,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                const rekening=result.map(rowDataPacket=>{
                    return{
                        id_rekening:rowDataPacket.rp_id_rekening,
                        nama_bank:rowDataPacket.rp_nama_bank,
                        nomor_rekening:rowDataPacket.rp_nomor_rekening,
                        saldo:rowDataPacket.rp_saldo,
                        rekening_utama:rowDataPacket.rp_rekening_utama,
                        id_cabang:rowDataPacket.rp_id_cabang_perusahaan,
                        nama_cabang:rowDataPacket.cp_nama_cabang,
                        alamat:null
                    }
                })
                resolve(rekening)
            })
        })
    }

    retrieveOneRekeningUtama(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT rp.rp_id_rekening, rp.rp_nama_bank, rp.rp_nomor_rekening, rp.rp_saldo, rp.rp_rekening_utama, rp.rp_id_cabang_perusahaan, cp.cp_nama_cabang "+
                "FROM rekening_perusahaan rp LEFT OUTER JOIN cabang_perusahaan cp ON rp.rp_id_cabang_perusahaan=cp.cp_id_cabang_perusahaan "+
                "WHERE rp_rekening_utama=1 AND rp.rp_id_cabang_perusahaan=?"

            this.mysqlConn.query(query, rekening.rp_id_cabang_perusahaan, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    const rekening=result.map(rowDataPacket=>{
                        return{
                            id_rekening:rowDataPacket.rp_id_rekening,
                            nama_bank:rowDataPacket.rp_nama_bank,
                            nomor_rekening:rowDataPacket.rp_nomor_rekening,
                            saldo:rowDataPacket.rp_saldo,
                            rekening_utama:rowDataPacket.rp_rekening_utama,
                            id_cabang:rowDataPacket.rp_id_cabang_perusahaan,
                            nama_cabang:rowDataPacket.cp_nama_cabang
                        }
                    })
                    resolve(rekening)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    getRekeningUtama(id_cabang){
        return new Promise((resolve,reject)=>{
            const query="SELECT rp_rekening_utama FROM rekening_perusahaan WHERE rp_id_cabang_perusahaan=?"
            this.mysqlConn.query(query, id_cabang, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                for(let i=0; i<result.length; i++){
                    if(result[i].rp_rekening_utama===1){
                        resolve(result[i].rp_rekening_utama)
                    }else if(result[i].rp_rekening_utama===0){
                        reject(MAIN_ACCOUNT_EXISTS)
                    }else{
                        reject(NO_SUCH_CONTENT)
                    }
                }
            })
        })
    }

    getRekeningNonUtama(id_cabang){
        return new Promise((resolve,reject)=>{
            const query="SELECT rp_rekening_utama FROM rekening_perusahaan WHERE rp_id_cabang_perusahaan=?"
            this.mysqlConn.query(query, id_cabang, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                for(let i=0; i<result.length; i++){
                    if(result[i].rp_rekening_utama===0){
                        resolve(result[i].rp_rekening_utama)
                    }else if(result[i].rp_rekening_utama===1){
                        reject(MAIN_ACCOUNT_EXISTS)
                    }else{
                        reject(NO_SUCH_CONTENT)
                    }
                }
            })
        })
    }

    setRekeningUtama(id_rekening){
        return new Promise((resolve,reject)=>{

            const query="UPDATE rekening_perusahaan SET rp_rekening_utama=1 WHERE rp_id_rekening=?"
            this.mysqlConn.query(query,id_rekening, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(SUCCESS)
            })
        })
    }

    unsetRekeningUtama(id_rekening){
        return new Promise((resolve,reject)=>{
            const query="UPDATE rekening_perusahaan SET rp_rekening_utama=0 WHERE rp_id_rekening=?"
            this.mysqlConn.query(query,id_rekening, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(SUCCESS)
            })
        })
    }

    unsetRekeningUtamaByPerusahaanId(id_perusahaan){
        return new Promise((resolve,reject)=>{
            const query="UPDATE rekening_perusahaan SET rp_rekening_utama=0 WHERE rp_id_cabang_perusahaan=?"
            this.mysqlConn.query(query,id_perusahaan,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(SUCCESS)
            })
        })
    }

    retrieveTransaksiRekening(){
        return new Promise((resolve,reject)=>{
            const query="SELECT tr.tr_id_transaksi_rekening, tr.tr_timestamp_transaksi, tr.tr_credit, tr.tr_debit, tr.tr_id_transaksi, "+
                "t.t_tanggal_transaksi, t.t_tanggal_modifiaksi, t.t_tanggal_realisasi, t.t_is_rutin, t.t_status, t.t_bon_sementara "+
                "FROM transaksi_rekening tr LEFT OUTER JOIN transaksi t ON tr.tr_id_transaksi=t.t_id_transaksi"

            this.mysqlConn.query(query,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                const transaksi=result.map(rowDataPacket=>{
                    return{
                        id_transaksi_rekening:rowDataPacket.tr_id_transaksi_rekening,
                        timestamp_transaksi:rowDataPacket.tr_timestamp_transaksi,
                        credit:rowDataPacket.tr_credit,
                        debit:rowDataPacket.tr_debit,
                        id_transaksi:rowDataPacket.tr_id_transaksi,
                        tanggal_transaksi:rowDataPacket.t_tanggal_transaksi,
                        tanggal_modifiaksi:rowDataPacket.t_tanggal_modifiaksi,
                        tanggal_realisasi:rowDataPacket.t_tanggal_realisasi,
                        is_rutin:rowDataPacket.t_is_rutin,
                        status:rowDataPacket.t_status,
                        bon_sementara:rowDataPacket.t_bon_sementara
                    }
                })
                resolve(transaksi)
            })
        })
    }

    retrieveOneTransaksiRekening(transfer){
        return new Promise((resolve,reject)=>{
            if(!transfer instanceof Transaksi_rekening){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            return new Promise((resolve,reject)=>{
                const query="SELECT tr.tr_id_transaksi_rekening, tr.tr_timestamp_transaksi, tr.tr_credit, tr.tr_debit, tr.tr_id_transaksi, "+
                    "t.t_tanggal_transaksi, t.t_tanggal_modifiaksi, t.t_tanggal_realisasi, t.t_is_rutin, t.t_status, t.t_bon_sementara "+
                    "FROM transaksi_rekening tr LEFT OUTER JOIN transaksi t ON tr.tr_id_transaksi=t.t_id_transaksi "+
                    "WHERE tr.tr_id_transaksi=? "

                this.mysqlConn.query(query,transfer.tr_id_transaksi,(error,result)=>{
                    if(error){
                        reject(error)
                        return
                    }else if(result.length>0){
                        const transaksi=result.map(rowDataPacket=>{
                            return{
                                id_transaksi_rekening:rowDataPacket.tr_id_transaksi_rekening,
                                timestamp_transaksi:rowDataPacket.tr_timestamp_transaksi,
                                credit:rowDataPacket.tr_credit,
                                debit:rowDataPacket.tr_debit,
                                id_transaksi:rowDataPacket.tr_id_transaksi,
                                tanggal_transaksi:rowDataPacket.t_tanggal_transaksi,
                                tanggal_modifiaksi:rowDataPacket.t_tanggal_modifiaksi,
                                tanggal_realisasi:rowDataPacket.t_tanggal_realisasi,
                                is_rutin:rowDataPacket.t_is_rutin,
                                status:rowDataPacket.t_status,
                                bon_sementara:rowDataPacket.t_bon_sementara
                            }
                        })
                        resolve(transaksi)
                    }else{
                        reject(NO_SUCH_CONTENT)
                    }
                })
            })
        })
    }

    addTransaksiRekening(transfer){
        return new Promise((resolve,reject)=>{
            if(!transfer instanceof Transaksi_rekening){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="INSERT INTO (`tr_timestamp_transaksi`, `tr_credit`, `tr_debit`, `tr_id_transaksi`)"
            this.mysqlConn.query(query,[transfer.tr_timestamp_transaksi, transfer.tr_credit, transfer.tr_debit, transfer.tr_id_transaksi],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                transfer.tr_id_transaksi_rekening=result.insertId
                resolve(transfer)
            })
        })
    }

    updateTransaksiRekening(transfer){
        return new Promise((resolve,reject)=>{
            if(!transfer instanceof Transaksi_rekening){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE transaksi_rekening SET tr_timestamp_transaksi=?, tr_credit=?, tr_debit=?, tr_id_transaksi=? WHERE tr_id_transaksi_rekening=? "
            this.mysqlConn.query(query,[transfer.tr_timestamp_transaksi, transfer.tr_credit, transfer.tr_debit, transfer.tr_id_transaksi, transfer.tr_id_transaksi_rekening],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                transfer.tr_id_transaksi_rekening=result.insertId
                resolve(transfer)
            })
        })
    }

    deleteTransaksiRekening(transfer){
        return new Promise((resolve,reject)=>{
            if(!transfer instanceof Transaksi_rekening){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="DELETE FROM transaksi_rekening WHERE tr_id_transaksi_rekening=?"
            this.mysqlConn.query(query,transfer.tr_id_transaksi_rekening,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                transfer.tr_id_transaksi_rekening=result.insertId
                resolve(transfer)
            })
        })
    }

    retrieveKategoriTransaksi(){
        return new Promise((resolve, reject)=>{
            const query="SELECT * FROM kategori_transaksi"
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const categories=result.map(rowDataPacket=>{
                    return{
                        id_kategori:rowDataPacket.kt_id_kategori,
                        nama_kategori:rowDataPacket.kt_nama_kategori
                    }
                })
                resolve(categories)
            })
        })
    }

    retrieveOneKategoriTransaksi(kategori){
        return new Promise((resolve, reject)=>{
            if(!kategori instanceof  Kategori_transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT * FROM kategori_transaksi WHERE kt_id_kategori=?"
            this.mysqlConn.query(query, kategori.kt_id_kategori, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    const categories=result.map(rowDataPacket=>{
                        return{
                            id_kategori:rowDataPacket.kt_id_kategori,
                            nama_kategori:rowDataPacket.kt_nama_kategori
                        }
                    })
                    resolve(categories)
                }

                else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    addKategoriTransaksi(kategori){
        return new Promise((resolve,reject)=>{
            if(!kategori instanceof Kategori_transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="INSERT INTO `kategori_transaksi` (`kt_nama_kategori`) VALUES(?)"
            this.mysqlConn.query(query, kategori.kt_nama_kategori, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                kategori.kt_id_kategori=result.insertId
                resolve(kategori)
            })
        })
    }

    updateKategoriTransaksi(kategori){
        return new Promise((resolve,reject)=>{
            if(!kategori instanceof Kategori_transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE kategori_transaksi SET kt_nama_kategori=? WHERE kt_id_kategori=?"
            this.mysqlConn.query(query, [kategori.kt_nama_kategori,kategori.kt_id_kategori], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                kategori.kt_id_kategori=result.kt_id_kategori
                resolve(kategori)
            })
        })
    }

    deleteKategoriTransaksi(kategori){
        return new Promise((resolve,reject)=>{
            if(!kategori instanceof Kategori_transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="DELETE FROM kategori_transaksi WHERE kt_id_kategori=?"
            this.mysqlConn.query(query,kategori.kt_id_kategori,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                kategori.kt_id_kategori=result.kt_id_kategori
                resolve(kategori)
            })
        })
    }

    retrieveKaryawanKerjaDimana(){
        return new Promise((resolve, reject)=>{
            const query="SELECT kkd.kkd_id_karyawan_kerja_dimana, kkd.kkd_id_karyawan, ka.k_nama_lengkap, kkd.kkd_id_cabang_perusahaan, cp.cp_nama_cabang FROM karyawan_kerja_dimana kkd LEFT OUTER JOIN karyawan ka ON kkd.kkd_id_karyawan=ka.k_id_karyawan "+
                "LEFT OUTER JOIN cabang_perusahaan cp ON kkd.kkd_id_cabang_perusahaan=cp.cp_id_cabang "
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const works=result.map(rowDataPacket=>{
                    return{
                        id_karyawan_kerja_dimana:rowDataPacket.kkd_id_karyawan_kerja_dimana,
                        id_karyawan:rowDataPacket.kkd_id_karyawan,
                        nama_lengkap:rowDataPacket.k_nama_lengkap,
                        id_cabang:rowDataPacket.kkd_id_cabang_perusahaan,
                        nama_cabang:rowDataPacket.cp_nama_cabang
                    }
                })
                resolve(works)
            })
        })
    }

    retrieveOneKaryawanKerjaDimana(kerja){
        return new Promise((resolve, reject)=>{
            if(!kerja instanceof Karyawan_kerja_dimana){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query = `
                SELECT 
                    kkd.kkd_id_karyawan_kerja_dimana, 
                    kkd.kkd_id_karyawan, 
                    ka.k_nama_lengkap, 
                    kkd.kkd_id_cabang_perusahaan, 
                    cp.cp_nama_cabang 
                FROM karyawan_kerja_dimana kkd 
                LEFT OUTER JOIN karyawan ka ON kkd.kkd_id_karyawan=ka.k_id_karyawan
                LEFT OUTER JOIN cabang_perusahaan cp ON kkd.kkd_id_cabang_perusahaan=cp.cp_id_cabang
                WHERE kkd.kkd_id_karyawan=?`;
            
            this.mysqlConn.query(query, kerja.kkd_id_karyawan, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    const works=result.map(rowDataPacket=>{
                        return{
                            id_karyawan_kerja_dimana:rowDataPacket.kkd_id_karyawan_kerja_dimana,
                            id_karyawan:rowDataPacket.kkd_id_karyawan,
                            nama_lengkap:rowDataPacket.k_nama_lengkap,
                            id_cabang:rowDataPacket.kkd_id_cabang_perusahaan,
                            nama_cabang:rowDataPacket.cp_nama_cabang
                        }
                    })
                    resolve(works)
                }

                else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    //By kkd_id_karyawan_kerja_dimana
    getKaryawanKerjaDimanaByID(kerja){
        return new Promise((resolve, reject)=>{
            if(!kerja instanceof Karyawan_kerja_dimana){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT kkd.kkd_id_karyawan_kerja_dimana, kkd.kkd_id_karyawan, ka.k_nama_lengkap, kkd.kkd_id_cabang_perusahaan, cp.cp_nama_cabang "+
                "FROM karyawan_kerja_dimana kkd LEFT OUTER JOIN karyawan ka ON kkd.kkd_id_karyawan=ka.k_id_karyawan "+
                "LEFT OUTER JOIN cabang_perusahaan cp ON kkd.kkd_id_cabang_perusahaan=cp.cp_id_cabang "+
                "WHERE kkd.kkd_id_karyawan_kerja_dimana=?"
            this.mysqlConn.query(query, kerja.kkd_id_karyawan_kerja_dimana, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    const works=result.map(rowDataPacket=>{
                        return{
                            id_karyawan_kerja_dimana:rowDataPacket.kkd_id_karyawan_kerja_dimana,
                            id_karyawan:rowDataPacket.kkd_id_karyawan,
                            nama_lengkap:rowDataPacket.k_nama_lengkap,
                            id_cabang:rowDataPacket.kkd_id_cabang_perusahaan,
                            nama_cabang:rowDataPacket.cp_nama_cabang
                        }
                    })
                    resolve(works)
                }

                else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    addKaryawan_kerja_dimana(kerja){
        return new Promise((resolve,reject)=>{
            if(!kerja instanceof Karyawan_kerja_dimana){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="INSERT INTO `karyawan_kerja_dimana` (`kkd_id_karyawan`,`kkd_id_cabang_perusahaan`) VALUES(?,?)"
            this.mysqlConn.query(query, [kerja.kkd_id_karyawan,kerja.kkd_id_cabang_perusahaan], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                kerja.kkd_id_karyawan_kerja_dimana=result.insertId
                resolve(kerja)
            })
        })
    }

    updateKaryawan_kerja_dimana(kerja){
        return new Promise((resolve,reject)=>{
            if(!kerja instanceof Karyawan_kerja_dimana){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE karyawan_kerja_dimana SET kkd_id_karyawan=?, kkd_id_cabang_perusahaan=? WHERE kkd_id_karyawan_kerja_dimana=?"
            this.mysqlConn.query(query, [kerja.kkd_id_karyawan,kerja.kkd_id_cabang_perusahaan,kerja.kkd_id_karyawan_kerja_dimana], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                kerja.kkd_id_karyawan_kerja_dimana=result.kkd_id_karyawan_kerja_dimana
                resolve(kerja)
            })
        })
    }

    deleteKaryawan_kerja_dimana(kerja){
        return new Promise((resolve,reject)=>{
            if(!kerja instanceof Karyawan_kerja_dimana){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="DELETE FROM karyawan_kerja_dimana WHERE kkd_id_karyawan_kerja_dimana=?"
            this.mysqlConn.query(query,kerja.kkd_id_karyawan_kerja_dimana,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                kerja.kkd_id_karyawan_kerja_dimana=result.kkd_id_karyawan_kerja_dimana
                resolve(kerja)
            })
        })
    }

    deleteKaryawanKerjaDimanaByKaryawanAndCabangIDs(kerja) {
        return new Promise((resolve,reject) => {
            if (!kerja instanceof Karyawan_kerja_dimana) {
                reject(MISMATCH_OBJ_TYPE);
                return;
            }

            const { kkd_id_karyawan, kkd_id_cabang_perusahaan } = kerja;
            const query = "DELETE FROM karyawan_kerja_dimana WHERE kkd_id_karyawan=? AND kkd_id_cabang_perusahaan=?";
            const values = [kkd_id_karyawan, kkd_id_cabang_perusahaan];
            this.mysqlConn.query(query, values, (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                kerja.kkd_id_karyawan_kerja_dimana = result.kkd_id_karyawan_kerja_dimana;
                resolve(kerja);
            })
        })
    }

    retrieveTransaksi(){
        return new Promise((resolve, reject)=>{
            const query="SELECT dt.td_id_transaksi, dt.td_id_detil_transaksi, t.t_tanggal_transaksi, t.t_tanggal_modifikasi, t.t_tanggal_realisasi, t.t_is_rutin, t.t_status, " +
                "t.t_rekening_penanggung_utama, rp.rp_nomor_rekening, t.t_id_cabang_perusahaan, cp.cp_nama_cabang, p.p_nama_perusahaan, t.t_id_karyawan, k.k_nama_lengkap, " +
                "dt.td_jumlah, dt.td_id_kategori_transaksi, kt.kt_nama_kategori, dt.td_bpu_attachment, dt.td_debit_credit, dt.td_nomor_bukti_transaksi, dt.td_file_bukti_transaksi, dt.skema_pembebanan_json, p.p_id_perusahaan "+
                "FROM detil_transaksi dt LEFT OUTER JOIN transaksi t ON dt.td_id_transaksi=t.t_id_transaksi "+
                "LEFT OUTER JOIN kategori_transaksi kt ON dt.td_id_kategori_transaksi=kt.kt_id_kategori " +
                "LEFT OUTER JOIN rekening_perusahaan rp ON t.t_rekening_penanggung_utama=rp.rp_id_rekening "+
                "LEFT OUTER JOIN cabang_perusahaan cp ON t.t_id_cabang_perusahaan=cp.cp_id_cabang " +
                "LEFT OUTER JOIN perusahaan p ON cp.cp_perusahaan_id=p.p_id_perusahaan " +
                "LEFT OUTER JOIN karyawan k ON t.t_id_karyawan=k.k_id_karyawan " +
                "WHERE t_is_deleted='0'"
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const transaksi=result.map(rowDataPacket=>{
                    return{
                        id_transaksi:rowDataPacket.td_id_transaksi,
                        id_perusahaan:rowDataPacket.p_id_perusahaan,
                        id_karyawan:rowDataPacket.k_id_karyawan,
                        nama_karyawan:rowDataPacket.k_nama_lengkap,
                        id_rekening:rowDataPacket.t_rekening_penanggung_utama,
                        nomor_rekening:rowDataPacket.rp_nomor_rekening,
                        id_cabang:rowDataPacket.t_id_cabang_perusahaan,
                        nama_cabang:rowDataPacket.cp_nama_cabang,
                        nama_perusahaan:rowDataPacket.p_nama_perusahaan,
                        tanggal_transaksi:rowDataPacket.t_tanggal_transaksi,
                        tanggal_modifikasi:rowDataPacket.t_tanggal_modifikasi,
                        tanggal_realisasi:rowDataPacket.t_tanggal_realisasi,
                        is_rutin:rowDataPacket.t_is_rutin,
                        status:rowDataPacket.t_status,
                        bon_sementara:rowDataPacket.t_bon_sementara,
                        id_detil_transaksi:rowDataPacket.td_id_detil_transaksi,
                        jumlah:rowDataPacket.td_jumlah,
                        id_kategori_transaksi:rowDataPacket.td_id_kategori_transaksi,
                        bpu_attachment:rowDataPacket.td_bpu_attachment,
                        debit_credit:rowDataPacket.td_debit_credit,
                        nomor_bukti_transaksi:rowDataPacket.td_nomor_bukti_transaksi,
                        file_bukti_transaksi:rowDataPacket.td_file_bukti_transaksi,
                        pembebanan_json:rowDataPacket.skema_pembebanan_json
                    }
                })
                resolve(transaksi)
            })
        })
    }

    retrieveOneTransaksi(transaksi){
        return new Promise((resolve, reject)=>{
            if(!transaksi instanceof Transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT dt.td_id_transaksi, dt.td_id_detil_transaksi, t.t_tanggal_transaksi, t.t_tanggal_modifikasi, t.t_tanggal_realisasi, t.t_is_rutin, t.t_status, " +
                "t.t_rekening_penanggung_utama, rp.rp_nomor_rekening, t.t_id_cabang_perusahaan, cp.cp_nama_cabang, p.p_nama_perusahaan, t.t_id_karyawan, k.k_nama_lengkap, " +
                "dt.td_jumlah, dt.td_id_kategori_transaksi, kt.kt_nama_kategori, dt.td_bpu_attachment, dt.td_debit_credit, dt.td_nomor_bukti_transaksi, dt.td_file_bukti_transaksi, dt.skema_pembebanan_json "+
                "FROM detil_transaksi dt LEFT OUTER JOIN transaksi t ON dt.td_id_transaksi=t.t_id_transaksi "+
                "LEFT OUTER JOIN kategori_transaksi kt ON dt.td_id_kategori_transaksi=kt.kt_id_kategori " +
                "LEFT OUTER JOIN rekening_perusahaan rp ON t.t_rekening_penanggung_utama=rp.rp_id_rekening "+
                "LEFT OUTER JOIN cabang_perusahaan cp ON t.t_id_cabang_perusahaan=cp.cp_id_cabang " +
                "LEFT OUTER JOIN perusahaan p ON cp.cp_perusahaan_id=p.p_id_perusahaan " +
                "LEFT OUTER JOIN karyawan k ON t.t_id_karyawan=k.k_id_karyawan " +
                "WHERE t_is_deleted='0' AND t_id_transaksi=?"
            this.mysqlConn.query(query, transaksi.t_id_transaksi, (error, result)=>{
                if(error){
                    reject(error)
                    return
                } else if(result.length>0){
                    const transaksi=result.map(rowDataPacket=>{
                        return{
                            id_karyawan:rowDataPacket.k_id_karyawan,
                            nama_karyawan:rowDataPacket.k_nama_lengkap,
                            id_rekening:rowDataPacket.t_rekening_penanggung_utama,
                            nomor_rekening:rowDataPacket.rp_nomor_rekening,
                            id_cabang:rowDataPacket.t_id_cabang_perusahaan,
                            nama_cabang:rowDataPacket.cp_nama_cabang,
                            nama_perusahaan:rowDataPacket.p_nama_perusahaan,
                            tanggal_transaksi:rowDataPacket.t_tanggal_transaksi,
                            tanggal_modifikasi:rowDataPacket.t_tanggal_modifikasi,
                            tanggal_realisasi:rowDataPacket.t_tanggal_realisasi,
                            is_rutin:rowDataPacket.t_is_rutin,
                            status:rowDataPacket.t_status,
                            bon_sementara:rowDataPacket.t_bon_sementara,
                            id_detil_transaksi:rowDataPacket.td_id_detil_transaksi,
                            jumlah:rowDataPacket.td_jumlah,
                            id_kategori_transaksi:rowDataPacket.td_id_kategori_transaksi,
                            bpu_attachment:rowDataPacket.td_bpu_attachment,
                            debit_credit:rowDataPacket.td_debit_credit,
                            nomor_bukti_transaksi:rowDataPacket.td_nomor_bukti_transaksi,
                            file_bukti_transaksi:rowDataPacket.td_file_bukti_transaksi,
                            pembebanan_json:rowDataPacket.skema_pembebanan_json
                        }
                    })
                    resolve(transaksi)
                } else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    retrieveDetilTransaksi(detil){
        return new Promise((resolve,reject)=>{
            if(!detil instanceof Detil_transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT * FROM detil_transaksi WHERE td_id_transaksi=?"
            this.mysqlConn.query(query,detil.td_id_transaksi,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    let details=[]
                    for(let i=0; i<result.length; i++){
                        details.push(new Detil_transaksi(
                            result[i].td_id_detil_transaksi,
                            result[i].td_id_transaksi,
                            result[i].td_jumlah,
                            result[i].td_id_kategori_transaksi,
                            result[i].td_bpu_attachment,
                            result[i].td_debit_credit,
                            result[i].td_nomor_bukti_transaksi,
                            result[i].td_file_bukti_transaksi,
                            result[i].skema_pembebanan_json,
                            result[i].td_is_deleted,
                            result[i].td_is_pembebanan_karyawan,
                            result[i].td_is_pembebanan_cabang
                        ))
                    }
                    resolve(details)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    getTransaksiID(transfer){
        return new Promise((resolve,reject)=>{
            if(!transfer instanceof Transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT t_id_transaksi FROM transaksi WHERE t_id_transaksi=? "
            this.mysqlConn.query(query, transfer.t_id_transaksi, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(transfer)
            })
        })
    }

    getTransaksiStatus(transfer){
        return new Promise((resolve,reject)=>{
            if(!transfer instanceof Transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT t_status FROM transaksi WHERE t_id_transaksi=?"
            this.mysqlConn.query(query,transfer.t_id_transaksi,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.t_status !='Approved' || result.t_status !='Rejected'){
                    resolve(transfer)
                }
            })
        })
    }

    getTransaksiFile(transaksi){
        return new Promise((resolve,reject)=>{
            if(transaksi instanceof Transaksi){
                const query="SELECT td_bpu_attachment, td_file_bukti_transaksi FROM detil_transaksi WHERE td_id_transaksi=?"
                this.mysqlConn.query(query,transaksi.t_id_transaksi,(error,result)=>{
                    if(error){
                        reject(error)
                        return
                    } else if(result.length>0){
                        let attachments=[]
                        for(let i=0; i<result.length; i++){
                            attachments.push(
                                result[i].td_bpu_attachment,
                                result[i].td_file_bukti_transaksi
                            )
                        }
                        resolve(attachments)
                    } else {
                        reject(NO_SUCH_CONTENT)
                    }
                })
            }else{
                reject(MISMATCH_OBJ_TYPE)
            }
        })
    }

    checkPembebananJson(detil){
        return new Promise((resolve,reject)=>{
            if(!detil instanceof Detil_transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT td_is_pembebanan_karyawan, td_is_pembebanan_cabang WHERE td_id_transaksi=? "
            this.mysqlConn.query(query,detil.td_id_transaksi,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    let pembebanan=[]
                    for(let i=0; result.length; i++){
                        pembebanan.push(
                            result[i].td_is_pembebanan_karyawan,
                            result[i].td_is_pembebanan_cabang
                        )
                    }
                    resolve(pembebanan)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    /*getPembebananJsonByKaryawanId(id_karyawan){
        return new Promise((resolve,reject)=>{
            const query="SELECT dt.skema_pembebanan_json FROM detil_transaksi dt "+
                "LEFT OUTER JOIN transaksi t ON t.t_id_transaksi=dt.td_id_transaksi "+
                "WHERE t.t_id_karyawan=?"
            this.mysqlConn.query(query,[id_karyawan],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    let pembebanan=[]
                    for(let i=0; i<result.length; i++){
                        pembebanan.push(
                            result[i].skema_pembebanan_json
                        )
                    }
                    resolve(pembebanan)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    getPembebananJsonByPerusahaanId(id_perusahaan){
        return new Promise((resolve,reject)=>{
            const query="SELECT dt.skema_pembebanan_json FROM detil_transaksi dt "+
                "LEFT OUTER JOIN transaksi t ON td_id_transaksi=t_id_transaksi "+
                "WHERE t.t_id_perusahaan=?"
            this.mysqlConn.query(query,id_perusahaan,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    resolve(result[0].skema_pembebanan_json)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }*/

    getDebitCreditTransaksi(detil){
        return new Promise((resolve,reject)=>{
            if(!detil instanceof Detil_transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT td_debit_credit FROM detil_transaksi WHERE td_id_transaksi=?"
            this.mysqlConn.query(query,detil.td_id_transaksi,(error,result)=>{
                if(error){
                    reject(error)
                }else if(result.length>0){
                    let type=[]
                    for(let i=0; i<result.length; i++){
                        type.push(
                            result[i].td_debit_credit
                        )
                    }
                    resolve(type)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    addTransaksi(transaksi) {
        return new Promise((resolve, reject) => {
            if (!transaksi instanceof Transaksi) {
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            try {
                let detailTransaksi = JSON.parse(transaksi.detail_transaksi);
                const query = "INSERT INTO `transaksi` (`t_tanggal_transaksi`, `t_tanggal_modifikasi`, `t_tanggal_realisasi`, `t_is_rutin`, `t_status`, `t_bon_sementara`, `t_rekening_penanggung_utama`, `t_id_cabang_perusahaan`, `t_id_karyawan`, `t_is_deleted`) "+
                    "VALUES(NOW(),NOW(),NULL,?,'Pending',?,?,?,?,0)"
                this.mysqlConn.query(query, [transaksi.t_is_rutin, transaksi.t_bon_sementara, transaksi.t_rekening_penanggung_utama, transaksi.t_id_cabang_perusahaan, transaksi.t_id_karyawan],async (error, result) => {
                    if (error) {
                        reject(error)
                        return
                    }

                    transaksi.t_id_transaksi = result.insertId

                    for (let i = 0; i < detailTransaksi.length; i++) {
                        // BEGINNING OF DETAIL TRANSAKSI LOOP
                        let transactionDetailObject = new Detil_transaksi(
                            null,
                            transaksi.t_id_transaksi,
                            detailTransaksi[i].td_jumlah,
                            detailTransaksi[i].td_id_kategori_transaksi,
                            transaksi.td_bpu_attachment,
                            detailTransaksi[i].td_debit_credit,
                            detailTransaksi[i].td_nomor_bukti_transaksi,
                            transaksi.td_file_bukti_transaksi,
                            detailTransaksi[i].skema_pembebanan_json,
                            0,
                            detailTransaksi[i].td_is_pembebanan_karyawan,
                            detailTransaksi[i].td_is_pembebanan_cabang
                        )

                        transactionDetailObject = await this.addDetailTransaksi(transactionDetailObject).catch(err=>{
                            reject(err)
                        })

                        detailTransaksi[i].td_id_detil_transaksi = transactionDetailObject.td_id_detil_transaksi
                        // END OF DETAIL TRANSAKSI LOOP
                    }

                    transaksi.detail_transaksi = JSON.stringify(detailTransaksi)

                    // TRANSAKSI AND DETIL TRANSAKSI HAS BEEN SUCCESSFUL THEREFORE APPEND TRANSAKSI_REKENING TABLE
                    //transaksi.transaksi_rekening = await this.addTransaksiRekening(new Transaksi_rekening(null, "NOW", null, null, result.insertId))

                    resolve(transaksi)
                })
            }catch(e){
                reject(e)
            }
        })
    }

    addDetailTransaksi(detailTransaksiObject){
        return new Promise((resolve, reject) => {
            const query="INSERT INTO `detil_transaksi` (" +
                "`td_id_transaksi`, " +
                "`td_jumlah`, " +
                "`td_id_kategori_transaksi`, " +
                "`td_bpu_attachment`, " +
                "`td_debit_credit`, " +
                "`td_nomor_bukti_transaksi`, " +
                "`td_file_bukti_transaksi`, " +
                "`skema_pembebanan_json`, " +
                "`td_is_deleted`," +
                "`td_is_pembebanan_karyawan`," +
                "`td_is_pembebanan_cabang`) "+
                "VALUES (?,?,?,?,?,?,?,?,?,?,?)"

            this.mysqlConn.query(query,[
                detailTransaksiObject.td_id_transaksi,
                detailTransaksiObject.td_jumlah,
                detailTransaksiObject.td_id_kategori_transaksi,
                detailTransaksiObject.td_bpu_attachment,
                detailTransaksiObject.td_debit_credit,
                detailTransaksiObject.td_nomor_bukti_transaksi,
                detailTransaksiObject.td_file_bukti_transaksi,
                detailTransaksiObject.skema_pembebanan_json,
                0,
                detailTransaksiObject.td_is_pembebanan_karyawan,
                detailTransaksiObject.td_is_pembebanan_cabang
            ],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                detailTransaksiObject.td_id_detil_transaksi=result.insertId
                resolve(detailTransaksiObject)
            })
        })
    }

    updateTransaksi(transaksi){
        return new Promise((resolve,reject)=>{

            if(!transaksi instanceof Transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            try{
                let detailTransaksi = JSON.parse(transaksi.detail_transaksi);
                const query="UPDATE transaksi SET t_tanggal_transaksi=NOW(), t_tanggal_modifikasi=NOW(), t_is_rutin=?, t_bon_sementara=?, " +
                    "t_rekening_penanggung_utama=?, t_id_cabang_perusahaan=?, t_id_karyawan=? " +
                    "WHERE t_id_transaksi= ?"

                this.mysqlConn.query(query,[transaksi.t_is_rutin,transaksi.t_bon_sementara,
                    transaksi.t_rekening_penanggung_utama, transaksi.t_id_cabang_perusahaan, transaksi.t_id_karyawan,
                    transaksi.t_id_transaksi],async (error,result)=>{
                    if(error){
                        reject(error)
                        return
                    }

                    for (let i = 0; i < detailTransaksi.length; i++) {
                        let transactionDetailObject = new Detil_transaksi(
                            detailTransaksi[i].td_id_detil_transaksi,
                            transaksi.t_id_transaksi,
                            detailTransaksi[i].td_jumlah,
                            detailTransaksi[i].td_id_kategori_transaksi,
                            transaksi.td_bpu_attachment,
                            detailTransaksi[i].td_debit_credit,
                            detailTransaksi[i].td_nomor_bukti_transaksi,
                            transaksi.td_file_bukti_transaksi,
                            detailTransaksi[i].skema_pembebanan_json,
                            0,
                            detailTransaksi[i].td_is_pembebanan_karyawan,
                            detailTransaksi[i].td_is_pembebanan_cabang
                        )

                        detailTransaksi[i].td_id_detil_transaksi = transactionDetailObject.td_id_detil_transaksi

                        transactionDetailObject = await this.deleteDetilTransaksi(new Detil_transaksi(detailTransaksi[i].td_id_detil_transaksi)).then(result=>{
                            this.addDetailTransaksi(transactionDetailObject).catch(err=>{
                                reject(err)
                            })
                        }).catch(err=>{
                            reject(err)
                        })
                    }

                    transaksi.detail_transaksi = JSON.stringify(detailTransaksi)
                    resolve(transaksi)
                })
            }catch (e){
                reject(e)
            }
        })
    }

    debitSaldo(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE rekening_perusahaan SET rp_saldo=rp_saldo+? WHERE rp_id_rekening=? "
            this.mysqlConn.query(query,[rekening.rp_saldo,rekening.rp_id_rekening],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(rekening)
            })
        })
    }

    creditSaldo(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE rekening_perusahaan SET rp_saldo=rp_saldo+? WHERE rp_id_rekening=? "
            this.mysqlConn.query(query,[rekening.rp_saldo,rekening.rp_id_rekening],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(rekening)
            })
        })
    }

   /* Delete this block only if you are permitted to.
   updateDetilTransaksi(detailTransaksiObject){
        return new Promise((resolve,reject)=>{
            if(!detailTransaksiObject instanceof Detil_transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE detil_transaksi SET td_jumlah=?, td_id_kategori_transaksi=?, td_bpu_attachment=?, td_debit_credit=?, " +
                "td_nomor_bukti_transaksi=?, td_file_bukti_transaksi=?, skema_pembebanan_json=? " +
                "WHERE td_id_detil_transaksi=? "
            this.mysqlConn.query(query,[
                detailTransaksiObject.td_jumlah,
                detailTransaksiObject.td_id_kategori_transaksi,
                detailTransaksiObject.td_bpu_attachment,
                detailTransaksiObject.td_debit_credit,
                detailTransaksiObject.td_nomor_bukti_transaksi,
                detailTransaksiObject.td_file_bukti_transaksi,
                detailTransaksiObject.skema_pembebanan_json,
                detailTransaksiObject.td_id_detil_transaksi
            ],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                //console.log(result)
                resolve(detailTransaksiObject)
            })
        })
    }*/

    approveTransaksi(transaksi){
        return new Promise((resolve,reject)=>{
            if(!transaksi instanceof Transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE transaksi SET t_status='Approved' WHERE t_id_transaksi=?"
            this.mysqlConn.query(query,transaksi.t_id_transaksi,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }
                resolve(SUCCESS)
            })
        })
    }

    rejectTransaksi(transaksi){
        return new Promise((resolve,reject)=>{
            if(!transaksi instanceof Transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE transaksi SET t_status='Rejected' WHERE t_id_transaksi=?"
            this.mysqlConn.query(query,transaksi.t_id_transaksi,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(SUCCESS)
            })
        })
    }

    deleteTransaksi(transaksi){
        return new Promise((resolve,reject)=>{
            if(!transaksi instanceof Transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE transaksi SET t_is_deleted=1 WHERE t_id_transaksi=?; "+
                "UPDATE detil_transaksi SET td_is_deleted=1 WHERE td_id_transaksi=?"
            this.mysqlConn.query(query,[transaksi.t_id_transaksi,transaksi.t_id_transaksi],(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                transaksi.t_id_transaksi=result.t_id_transaksi
                resolve(transaksi)
            })
        })
    }

    deleteDetilTransaksi(detil){
        return new Promise((resolve,reject)=>{
            if(!detil instanceof Detil_transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            console.log(detil.td_id_detil_transaksi)
            const query="DELETE FROM detil_transaksi WHERE td_id_detil_transaksi=? "
            this.mysqlConn.query(query, detil.td_id_detil_transaksi,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                resolve(detil)
            })
        })
    }
}