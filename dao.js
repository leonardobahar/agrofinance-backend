import mysqlConn from './mysql-conn'
import fs from 'fs'
import {
    ADMIN_VALIDATED,
    ALL, CANCELLED, DUPLICATE_ENTRY, ERROR_DUPLICATE_ENTRY, INVALID, INVALID_FINAL,
    MISMATCH_OBJ_TYPE,
    NO_AFFECTED_ROWS,
    NO_SUCH_CONTENT,
    ONLY_WITH_VENDORS, ORDER_PROCESSING,
    SOMETHING_WENT_WRONG, SUCCESS, VALID, WRONG_BODY_FORMAT
} from "./strings"
import {
    Detil_transaksi,
    Karyawan,
    Karyawan_kerja_dimana,
    Kategori_transaksi,
    Pembebanan,
    Perusahaan, Rekening_perusahaan,
    Transaksi, Transaksi_rekening
} from "./model";
import {resolveShowConfigPath} from "@babel/core/src/config/files/index-browser";

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

    retrieveKaryawan(){
        return new Promise((resolve, reject)=>{
            const query="SELECT * FROM karyawan"
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

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
            this.mysqlConn.query(query, karyawan.k_id_karyawan, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    let employees=[]
                    for(let i =0;i<result.length;i++){
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
                }

                else {
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
            const query="SELECT * FROM perusahaan"
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                let companies=[]
                for(let i=0; i<result.length; i++){
                    companies.push(new Perusahaan(
                        result[i].p_id_perusahaan,
                        result[i].p_nama_perusahaan,
                        result[i].p_alamat
                    ))
                }
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

            const query="SELECT * FROM perusahaan WHERE p_id_perusahaan=?"
            this.mysqlConn.query(query, perusahaan.p_id_perusahaan, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    let companies=[]
                    for(let i =0;i<result.length;i++){
                        companies.push(new Perusahaan(
                            result[i].p_id_perusahaan,
                            result[i].p_nama_perusahaan,
                            result[i].p_alamat
                        ))
                    }
                    resolve(companies)
                }

                else{
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

            const query="INSERT INTO `perusahaan` (`p_nama_perusahaan`,`p_alamat`) VALUES(?,?)"
            this.mysqlConn.query(query, [perusahaan.p_nama_perusahaan,perusahaan.p_alamat], (error,result)=>{
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

            const query="UPDATE perusahaan SET p_nama_perusahaan=?, p_alamat=? WHERE p_id_perusahaan=?"
            this.mysqlConn.query(query, [perusahaan.p_nama_perusahaan, perusahaan.p_alamat, perusahaan.p_id_perusahaan], (error,result)=>{
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

    retrieveRekeningPerusahaan(){
        return new Promise((resolve,reject)=>{
            const query="SELECT rp.rp_nama_bank, rp.rp_nomor_rekening, rp.rp_saldo, rp.rp_id_perusahaan, p.p_nama_perusahaan, p.p_alamat "+
                "FROM rekening_perusahaan rp LEFT OUTER JOIN perusahaan p ON rp.rp_id_perusahaan=p.p_id_perusahaan "
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const rekening=result.map(rowDataPacket=>{
                    return{
                        rp_id_rekening:rowDataPacket.rp_id_rekening,
                        rp_nama_bank:rowDataPacket.rp_nama_bank,
                        rp_nomor_rekening:rowDataPacket.rp_nomor_rekening,
                        rp_saldo:rowDataPacket.rp_saldo,
                        rp_id_perusahaan:rowDataPacket.rp_id_perusahaan,
                        p_nama_perusahaan:rowDataPacket.p_nama_perusahaan,
                        p_alamat:rowDataPacket.p_alamat
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

            const query="SELECT rp.rp_nama_bank, rp.rp_nomor_rekening, rp.rp_saldo, rp.rp_id_perusahaan, p.p_nama_perusahaan, p.p_alamat "+
                "FROM rekening_perusahaan rp LEFT OUTER JOIN perusahaan p ON rp.rp_id_perusahaan=p.p_id_perusahaan "+
                "WHERE rp_id_perusahaan=? "
            this.mysqlConn.query(query, rekening.rp_id_perusahaan, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }else if(result.length>0){
                    const rekening=result.map(rowDataPacket=>{
                        return{
                            rp_id_rekening:rowDataPacket.rp_id_rekening,
                            rp_nama_bank:rowDataPacket.rp_nama_bank,
                            rp_nomor_rekening:rowDataPacket.rp_nomor_rekening,
                            rp_saldo:rowDataPacket.rp_saldo,
                            rp_id_perusahaan:rowDataPacket.rp_id_perusahaan,
                            p_nama_perusahaan:rowDataPacket.p_nama_perusahaan,
                            p_alamat:rowDataPacket.p_alamat
                        }
                    })
                    resolve(rekening)
                }else{
                    reject(NO_SUCH_CONTENT)
                }
                resolve(rekening)
            })
        })
    }

    /*getRekeningPerusahanId(rekening){
        return new Promise((resolve,reject))
    }*/

    addRekeningPerusahaan(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="INSERT INTO `rekening_perusahaan` (`rp_nama_bank`, `rp_nomor_rekening`, `rp_saldo`, `rp_id_perusahaan`) VALUES(?, ?, ?, ?)"
            this.mysqlConn.query(query,[rekening.rp_nama_bank,rekening.rp_nomor_rekening,rekening.rp_saldo,rekening.rp_id_perusahaan],(result,error)=>{
                if(error){
                    reject(error)
                    return
                }

                rekening.rp_id_rekening=result.insertId
                resolve(rekening)
            })
        })
    }

    updateRekeningPerusahaan(rekening){
        return new Promise((resolve,reject)=>{
            if(!rekening instanceof Rekening_perusahaan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE rekening_perusahaan SET rp_nama_bank=?, rp_nomor_rekening=?, rp_saldo=?, rp_id_perusahaan=? "+
                "WHERE rp_id_rekening=?"

            this.mysqlConn.query(query, [rekening.rp_nama_bank, rekening.rp_nomor_rekening, rekening.rp_saldo, rekening.rp_id_perusahaan, rekening.rp_id_rekening],(error,result)=>{
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

            const query="DELETE FROM rekening_perusahaan WHERE rp_id_rekening=?"
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
                        tr_id_transaksi_rekening:rowDataPacket.tr_id_transaksi_rekening,
                        tr_timestamp_transaksi:rowDataPacket.tr_timestamp_transaksi,
                        tr_credit:rowDataPacket.tr_credit,
                        tr_debit:rowDataPacket.tr_debit,
                        tr_id_transaksi:rowDataPacket.tr_id_transaksi,
                        t_tanggal_transaksi:rowDataPacket.t_tanggal_transaksi,
                        t_tanggal_modifiaksi:rowDataPacket.t_tanggal_modifiaksi,
                        t_tanggal_realisasi:rowDataPacket.t_tanggal_realisasi,
                        t_is_rutin:rowDataPacket.t_is_rutin,
                        t_status:rowDataPacket.t_status,
                        t_bon_sementara:rowDataPacket.t_bon_sementara
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
                                tr_id_transaksi_rekening:rowDataPacket.tr_id_transaksi_rekening,
                                tr_timestamp_transaksi:rowDataPacket.tr_timestamp_transaksi,
                                tr_credit:rowDataPacket.tr_credit,
                                tr_debit:rowDataPacket.tr_debit,
                                tr_id_transaksi:rowDataPacket.tr_id_transaksi,
                                t_tanggal_transaksi:rowDataPacket.t_tanggal_transaksi,
                                t_tanggal_modifiaksi:rowDataPacket.t_tanggal_modifiaksi,
                                t_tanggal_realisasi:rowDataPacket.t_tanggal_realisasi,
                                t_is_rutin:rowDataPacket.t_is_rutin,
                                t_status:rowDataPacket.t_status,
                                t_bon_sementara:rowDataPacket.t_bon_sementara
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

    retrievePembebanan(){
        return new Promise((resolve, reject)=>{
            const query="SELECT * FROM pembebanan"
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                let beban=[]
                for(let i=0; i<result.length; i++){
                    beban.push(new Perusahaan(
                        result[i].pbb_id,
                        result[i].skema_pembebanan_json
                    ))
                }
                resolve(beban)
            })
        })
    }

    retrieveOnePembebanan(pembebanan){
        return new Promise((resolve, reject)=>{
            if(!pembebanan instanceof Pembebanan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="SELECT * FROM pembebanan WHERE pbb_id=?"
            this.mysqlConn.query(query, pembebanan.pbb_id, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    let beban=[]
                    for(let i =0;i<result.length;i++){
                        beban.push(new Pembebanan(
                            result[i].pbb_id,
                            result[i].skema_pembebanan_json
                        ))
                    }
                    resolve(beban)
                }

                else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    addPembebanan(pembebanan){
        return new Promise((resolve,reject)=>{
            if(!pembebanan instanceof Pembebanan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="INSERT INTO `pembebanan` (`skema_pembebanan_json`) VALUES(?)"
            this.mysqlConn.query(query, pembebanan.skema_pembebanan_json, (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                pembebanan.pbb_id=result.insertId
                resolve(pembebanan)
            })
        })
    }

    updatePembebanan(pembebanan){
        return new Promise((resolve,reject)=>{
            if(!pembebanan instanceof Pembebanan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE pembebanan SET skema_pembebanan_json=? WHERE pbb_id=?"
            this.mysqlConn.query(query, [pembebanan.skema_pembebanan_json,pembebanan.pbb_id], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                pembebanan.pbb_id=result.pbb_id
                resolve(pembebanan)
            })
        })
    }

    deletePembebanan(pembebanan){
        return new Promise((resolve,reject)=>{
            if(!pembebanan instanceof Pembebanan){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="DELETE FROM pembebanan WHERE pbb_id=?"
            this.mysqlConn.query(query,pembebanan.pbb_id,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                pembebanan.pbb_id=result.pbb_id
                resolve(pembebanan)
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

                let categories=[]
                for(let i=0; i<result.length; i++){
                    categories.push(new Kategori_transaksi(
                        result[i].kt_id_kategori,
                        result[i].kt_nama_kategori
                    ))
                }
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
                    let categories=[]
                    for(let i =0;i<result.length;i++){
                        categories.push(new Kategori_transaksi(
                            result[i].kt_id_kategori,
                            result[i].kt_nama_kategori
                        ))
                    }
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
            const query="SELECT kkd.kkd_id_karyawan_kerja_dimana, kkd.kkd_id_karyawan, ka.k_nama_lengkap, kkd.kkd_id_perusahaan, p.p_nama_perusahaan FROM karyawan_kerja_dimana kkd LEFT OUTER JOIN karyawan ka ON kkd.kkd_id_karyawan=ka.k_id_karyawan "+
                "LEFT OUTER JOIN perusahaan p ON kkd.kkd_id_perusahaan=p.p_id_perusahaan "
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const works=result.map(rowDataPacket=>{
                    return{
                        kkd_id_karyawan_kerja_dimana:rowDataPacket.kkd_id_karyawan_kerja_dimana,
                        kkd_id_karyawan:rowDataPacket.kkd_id_karyawan,
                        kkd_nama_lengkap:rowDataPacket.k_nama_lengkap,
                        kkd_id_perusahaan:rowDataPacket.kkd_id_perusahaan,
                        kkd_nama_perusahaan:rowDataPacket.p_nama_perusahaan
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

            const query="SELECT kkd.kkd_id_karyawan_kerja_dimana, kkd.kkd_id_karyawan, ka.k_nama_lengkap, kkd.kkd_id_perusahaan, p.p_nama_perusahaan FROM karyawan_kerja_dimana kkd LEFT OUTER JOIN karyawan ka ON kkd_id_karyawan=ka.k_id_karyawan "+
                "LEFT OUTER JOIN perusahaan p ON kkd.kkd_id_perusahaan=p.p_id_perusahaan "+
                "WHERE kkd.kkd_id_karyawan=?"
            this.mysqlConn.query(query, kerja.kkd_id_karyawan, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    const works=result.map(rowDataPacket=>{
                        return{
                            kkd_id_karyawan_kerja_dimana:rowDataPacket.kkd_id_karyawan_kerja_dimana,
                            kkd_id_karyawan:rowDataPacket.kkd_id_karyawan,
                            kkd_nama_lengkap:rowDataPacket.k_nama_lengkap,
                            kkd_id_perusahaan:rowDataPacket.kkd_id_perusahaan,
                            kkd_nama_perusahaan:rowDataPacket.p_nama_perusahaan
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

            const query="SELECT kkd.kkd_id_karyawan_kerja_dimana, kkd.kkd_id_karyawan, ka.k_nama_lengkap, kkd.kkd_id_perusahaan, p.p_nama_perusahaan FROM karyawan_kerja_dimana kkd LEFT OUTER JOIN karyawan ka ON kkd_id_karyawan=ka.k_id_karyawan "+
                "LEFT OUTER JOIN perusahaan p ON kkd.kkd_id_perusahaan=p.p_id_perusahaan "+
                "WHERE kkd.kkd_id_karyawan_kerja_dimana=?"
            this.mysqlConn.query(query, kerja.kkd_id_karyawan_kerja_dimana, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    const works=result.map(rowDataPacket=>{
                        return{
                            kkd_id_karyawan_kerja_dimana:rowDataPacket.kkd_id_karyawan_kerja_dimana,
                            kkd_id_karyawan:rowDataPacket.kkd_id_karyawan,
                            kkd_nama_lengkap:rowDataPacket.k_nama_lengkap,
                            kkd_id_perusahaan:rowDataPacket.kkd_id_perusahaan,
                            kkd_nama_perusahaan:rowDataPacket.p_nama_perusahaan
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

            const query="INSERT INTO `karyawan_kerja_dimana` (`kkd_id_karyawan`,`kkd_id_perusahaan`) VALUES(?,?)"
            this.mysqlConn.query(query, [kerja.kkd_id_karyawan,kerja.kkd_id_perusahaan], (error,result)=>{
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

            const query="UPDATE karyawan_kerja_dimana SET kkd_id_karyawan=?, kkd_id_perusahaan=? WHERE kkd_id_karyawan_kerja_dimana=?"
            this.mysqlConn.query(query, [kerja.kkd_id_karyawan,kerja.kkd_id_perusahaan,kerja.kkd_id_karyawan_kerja_dimana], (error,result)=>{
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

    retrieveTransaksi(){
        return new Promise((resolve, reject)=>{
            const query="SELECT dt.td_id_transaksi, dt.td_id_detil_transaksi, t.t_tanggal_transaksi, t.t_tanggal_modifiaksi, t.t_tanggal_realisasi, t.t_is_rutin, dt.td_jumlah, dt.td_id_kategori_transaksi, kt.kt_nama_kategori, dt.td_jenis, dt.td_bpu_attachment, dt.td_debit_credit, dt.td_nomor_bukti_transaksi, dt.td_file_bukti_transaksi, dt.td_pembebanan_id, pbb.skema_pembebanan_json "+
                "FROM detil_transaksi dt LEFT OUTER JOIN transaksi t ON dt.td_id_transaksi=t.t_id_transaksi "+
                "LEFT OUTER JOIN kategori_transaksi kt ON dt.td_id_kategori_transaksi=kt.kt_id_kategori "+
                "LEFT OUTER JOIN pembebanan p ON dt.td_pembebanan_id=p.pbb_id "+
                "WHERE t_is_deleted='0'"
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const transaksi=result.map(rowDataPacket=>{
                    return{
                        t_tanggal_transaksi:rowDataPacket.t_tanggal_transaksi,
                        t_tanggal_modifikasi:rowDataPacket.t_tanggal_modifikasi,
                        t_tanggal_realisasi:rowDataPacket.t_tanggal_realisasi,
                        t_is_rutin:rowDataPacket.t_is_rutin,
                        t_status:rowDataPacket.t_status,
                        t_bon_sementara:rowDataPacket.t_bon_sementara,
                        td_id_detil_transaksi:rowDataPacket.td_id_detil_transaksi,
                        td_jumlah:rowDataPacket.td_jumlah,
                        td_id_kategori_transaksi:rowDataPacket.td_id_kategori_transaksi,
                        td_jenis:rowDataPacket.td_jenis,
                        td_bpu_attachment:rowDataPacket.td_bpu_attachment,
                        td_debit_credit:rowDataPacket.td_debit_credit,
                        td_nomor_bukti_transaksi:rowDataPacket.td_nomor_bukti_transaksi,
                        td_file_bukti_transaksi:rowDataPacket.td_file_bukti_transaksi,
                        td_pembebanan_id:rowDataPacket.td_pembebanan_id,
                        skema_pembebanan_json:rowDataPacket.skema_pembebanan_json
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

            const query="SELECT * FROM transaksi WHERE t_id_transaksi=?"
            this.mysqlConn.query(query, transaksi.t_id_transaksi, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    let transaksi=[]
                    for(let i=0; i<result.length; i++){
                        transaksi.push(new Transaksi(
                            result[i].t_id_transaksi,
                            result[i].t_tanggal_transaksi,
                            result[i].t_tanggal_modifikasi,
                            result[i].t_tanggal_realisasi,
                            result[i].t_is_rutin,
                            result[i].t_status,
                            result[i].t_bon_sementara
                        ))
                    }
                    resolve(transaksi)
                }

                else{
                    reject(NO_SUCH_CONTENT)
                }
            })
        })
    }

    getTransaksiFile(transaksi){
        return new Promise((resolve,reject)=>{
            if(transaksi instanceof Transaksi){
                const query="SELECT td_bpu_attachment FROM detil_transaksi WHERE td_id_transaksi=?"
                this.mysqlConn.query(query,transaksi.t_id_transaksi,(error,result)=>{
                    if(error){
                        reject(error)
                        return
                    } else if(result.length>0){
                        resolve(result[0].td_bpu_attachment)
                    } else {
                        reject(NO_SUCH_CONTENT)
                    }
                })
            }else{
                reject(MISMATCH_OBJ_TYPE)
            }
        })
    }

    addTransaksi(transaksi) {
        return new Promise((resolve, reject) => {
            if (!transaksi instanceof Transaksi) {
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            try {
                let detailTransaksi = JSON.parse(transaksi.detail_transaksi)
                const query = "INSERT INTO `transaksi` (`t_tanggal_transaksi`, `t_tanggal_modifikasi`, `t_tanggal_realisasi`, `t_is_rutin`, `t_status`, `t_bon_sementara`, `t_is_deleted`) VALUES(NOW(),NOW(),'NULL',?,'Entry di buat',?,'0')"
                this.mysqlConn.query(query, [transaksi.t_is_rutin, transaksi.t_bon_sementara], (error, result) => {
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
                            detailTransaksi[i].td_jenis,
                            detailTransaksi[i].td_bpu_attachment,
                            detailTransaksi[i].td_debit_credit,
                            detailTransaksi[i].td_nomor_bukti_transaksi,
                            detailTransaksi[i].td_file_bukti_transaksi,
                            detailTransaksi[i].td_pembebanan_id,
                            0
                        )

                        this.addDetailTransaksi(transactionDetailObject).then(addDetailTransaksiResult=>{
                            transactionDetailObject = addDetailTransaksiResult
                        }).catch(err=>{
                            reject(err)
                        })

                        detailTransaksi[i].td_id_detil_transaksi = transactionDetailObject.td_id_detil_transaksi
                    // END OF DETAIL TRANSAKSI LOOP
                    }

                    transaksi.detail_transaksi = JSON.stringify(detailTransaksi)
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
                "`td_jenis`, " +
                "`td_bpu_attachment`, " +
                "`td_debit_credit`, " +
                "`td_nomor_bukti_transaksi`, " +
                "`td_file_bukti_transaksi`, " +
                "`td_pembebanan_id`, " +
                "`td_is_deleted`) "+
                "VALUES (?,?,?,?,?,?,?,?,?,?)"

            this.mysqlConn.query(query,[
                detailTransaksiObject.td_id_transaksi,
                detailTransaksiObject.td_jumlah,
                detailTransaksiObject.td_id_kategori_transaksi,
                detailTransaksiObject.td_jenis,
                detailTransaksiObject.td_bpu_attachment,
                detailTransaksiObject.td_debit_credit,
                detailTransaksiObject.td_nomor_bukti_transaksi,
                'BPU',
                detailTransaksiObject.td_pembebanan_id,
                0
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

            const query="UPDATE transaksi SET t_tnaggal_transaksi=NOW(), t_tanggal_modifikasi=NOW(), t_tanggal_realisasi=NOW(),t_is_rutin=?, t_status=?, t_bon_sementara=?"
            this.mysqlConn.query(query, [transaksi.t_is_rutin,transaksi.t_status,transaksi.t_bon_sementara,  transaksi.t_id_transaksi], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                transaksi.t_id_transaksi=result.t_id_transaksi
                resolve(transaksi)
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
}
