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
import {Karyawan, Karyawan_kerja_dimana, Kategori_transaksi, Pembebanan, Perusahaan, Transaksi} from "./model";

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
                        setTimeout(handleConnection(), 2000)
                    }else{
                        this.mysqlConn.query(this._initSqlStmt, (err, res, fields)=>{
                            if(err){
                                throw err
                            }else {
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
                        throw err
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

                karyawan.k_nama_lengkap=result.k_nama_lengkap
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

                perusahaan.p_nama_perusahaan=result.p_nama_perusahaan
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

                pembebanan.skema_pembebanan_json=result.skema_pembebanan_json
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

                kategori.kt_nama_kategori=result.kt_nama_kategori
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

                kerja.kkd_id_karyawan=result.kkd_id_karyawan
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

            const query="DELETE FROM karyawan_kerja_dimana WHERE kkd_id_karyawan=?"
            this.mysqlConn.query(query,kerja.kkd_id_karyawan,(error,result)=>{
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
            const query="SELECT t.t_id_transaksi, t.t_jumlah, t.t_id_kategori_transaksi, kt.kt_nama_kategori, t.t_jenis, t.t_bpu_attachment, t.t_debit_card, t.t_status, t.t_bon_sementara "+
                "t.t_is_rutin, t.t_tanggal_transaksi, t.t_tanggal_modifikasi, t.t_tanggal_realisasi, t.t_nomor_bukti_transaksi, t.t_file_bukti_transaksi, t.t_pembebanan_id, p.skema_pembebanan_json "+
                "FROM transaksi t LEFT OUTER JOIN kategori_transaksi kt ON t.t_id_kategori_transaksi "+
                "LEFT OUTER JOIN pembebanan p ON t.t_pembebanan_id=p.pbb_id "
            this.mysqlConn.query(query, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                const transaksi=result.map(rowDataPacket=>{
                    return{
                        id_transaksi:rowDataPacket.t_id_transaksi,
                        jumlah:rowDataPacket.t_jumlah,
                        id_kategori_transaksi:rowDataPacket.t_id_kategori_transaksi,
                        nama_kategori:rowDataPacket.kt_nama_kategori,
                        jenis:rowDataPacket.t_jenis,
                        bpu_attachment:rowDataPacket.t_bpu_attachment,
                        debit_card:rowDataPacket.t_debit_card,
                        status:rowDataPacket.t_status,
                        bon_sementara:rowDataPacket.t_bon_sementara,
                        is_rutin:rowDataPacket.t_is_rutin,
                        tanggal_transaksi:rowDataPacket.t_tanggal_transaksi,
                        tanggal_modifikasi:rowDataPacket.t_tanggal_modifikasi,
                        tanggal_realisasi:rowDataPacket.t_tanggal_realisasi,
                        nomor_bukti_transaksi:rowDataPacket.t_nomor_bukti_transaksi,
                        file_bukti_transaksi:rowDataPacket.t_file_bukti_transaksi,
                        pembebanan_id:rowDataPacket.t_pembebanan_id,
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

            const query="SELECT t.t_id_transaksi, t.t_jumlah, t.t_id_kategori_transaksi, kt.kt_nama_kategori, t.t_jenis, t.t_bpu_attachment, t.t_debit_card, t.t_status, t.t_bon_sementara "+
                "t.t_is_rutin, t.t_tanggal_transaksi, t.t_tanggal_modifikasi, t.t_tanggal_realisasi, t.t_nomor_bukti_transaksi, t.t_file_bukti_transaksi, t.t_pembebanan_id, p.skema_pembebanan_json "+
                "FROM transaksi t LEFT OUTER JOIN kategori_transaksi kt ON t.t_id_kategori_transaksi "+
                "LEFT OUTER JOIN pembebanan p ON t.t_pembebanan_id=p.pbb_id "+
                "WHERE t_id_transaksi=?"
            this.mysqlConn.query(query, transaksi.t_id_transaksi, (error, result)=>{
                if(error){
                    reject(error)
                    return
                }

                else if(result.length>0){
                    const transaksi=result.map(rowDataPacket=>{
                        return{
                            id_transaksi:rowDataPacket.t_id_transaksi,
                            jumlah:rowDataPacket.t_jumlah,
                            id_kategori_transaksi:rowDataPacket.t_id_kategori_transaksi,
                            nama_kategori:rowDataPacket.kt_nama_kategori,
                            jenis:rowDataPacket.t_jenis,
                            bpu_attachment:rowDataPacket.t_bpu_attachment,
                            debit_card:rowDataPacket.t_debit_card,
                            status:rowDataPacket.t_status,
                            bon_sementara:rowDataPacket.t_bon_sementara,
                            is_rutin:rowDataPacket.t_is_rutin,
                            tanggal_transaksi:rowDataPacket.t_tanggal_transaksi,
                            tanggal_modifikasi:rowDataPacket.t_tanggal_modifikasi,
                            tanggal_realisasi:rowDataPacket.t_tanggal_realisasi,
                            nomor_bukti_transaksi:rowDataPacket.t_nomor_bukti_transaksi,
                            file_bukti_transaksi:rowDataPacket.t_file_bukti_transaksi,
                            pembebanan_id:rowDataPacket.t_pembebanan_id,
                            skema_pembebanan_json:rowDataPacket.skema_pembebanan_json
                        }
                    })
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
                const query="SELECT * FROM transaksi WHERE id=?"
                this.mysqlConn.query(query,transaksi.id,(error,result)=>{
                    if(error){
                        reject(error)
                        return
                    }

                    transaksi.id=result.insertId
                    resolve(transaksi)
                })
            }
        })
    }

    addTransaksi(transaksi){
        return new Promise((resolve,reject)=>{
            if(!transaksi instanceof Transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="INSERT INTO `transaksi` (`t_jumlah`,`t_id_kategori_transaksi`,`t_jenis`, `t_bpu_attachment`, `t_debit_credit`, `t_status`, `t_bon_sementara`, `t_is_rutin`, `t_tanggal_transaksi`, `t_tanggal_modifikasi`, `t_tanggal_realisasi`, `t_nomor_bukti_transaksi`, `t_file_bukti_transaksi`, `t_pembebanan_id`) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
            this.mysqlConn.query(query, [transaksi.t_jumlah,transaksi.t_id_kategori_transaksi,transaksi.t_jenis,transaksi.t_bpu_attachment,transaksi.t_debit_credit,transaksi.t_status,transaksi.t_bon_sementara,
                    transaksi.t_is_rutin,transaksi.t_tanggal_transaksi,transaksi.t_tanggal_modifikasi,transaksi.t_tanggal_realisasi,transaksi.t_nomor_bukti_transaksi,transaksi.t_file_bukti_transaksi,transaksi.t_pembebanan_id], (error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                transaksi.t_jumlah=result.t_jumlah
                resolve(transaksi)
            })
        })
    }

    updateTransaksi(transaksi){
        return new Promise((resolve,reject)=>{
            if(!transaksi instanceof Transaksi){
                reject(MISMATCH_OBJ_TYPE)
                return
            }

            const query="UPDATE transaksi SET t_jumlah=?, t_id_kategori_transaksi=?, t_jenis=?, t_bpu_attachment=?, t_debit_card=?, t_status=?, t_bon_sementara=?, t_is_rutin=?, t_tnaggal_transaksi=?, t_tanggal_modifikasi=?, t_tanggal_realisasi=?, t_nomor_bukti_transaksi=?, t_file_bukti_transaksi=?, t_pembebanan_id=? WHERE t_id_transaksi=?"
            this.mysqlConn.query(query, [transaksi.t_jumlah,transaksi.t_id_kategori_transaksi,transaksi.t_jenis,transaksi.t_bpu_attachment,transaksi.t_debit_card,transaksi.t_status,transaksi.t_bon_sementara,
                transaksi.t_is_rutin,transaksi.t_tanggal_transaksi,transaksi.t_tanggal_modifikasi,transaksi.t_tanggal_realisasi,transaksi.t_nomor_bukti_transaksi,transaksi.t_file_bukti_transaksi,transaksi.t_pembebanan_id, transaksi.t_id_transaksi], (error,result)=>{
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

            const query="DELETE FROM transaksi WHERE t_id_transaksi=?"
            this.mysqlConn.query(query,transaksi.t_id_transaksi,(error,result)=>{
                if(error){
                    reject(error)
                    return
                }

                transaksi.t_id_transaksi=result.t_id_transaksi
                resolve(result)
            })
        })
    }

   /* bindKaryawanToPerusahaan(karyawan,perusahaan){
        return new Promise((resolve,reject)=>{
            if(karyawan instanceof Karyawan && perusahaan instanceof Perusahaan){
                const checkQuery="SELECT kkd_id_karyawan_kerja_dimana FROM karyawan_kerja_dimana WHERE kkd_id_karyawan=?, kkd_id_perusahaan=? "
                this.mysqlConn.query(checkQuery, [karyawan.kkd_id_karyawan,perusahaan.kkd_id_perusahaan],(err,res)=>{
                    if(res.length>1){
                        reject(ERROR_DUPLICATE_ENTRY)
                        return
                    }

                    const query="INSERT INTO `karyawan_kerja_dimana` (`kkd_id_karyawan`, `kkd_id_perusahaan`) VALUES(?, ?)"
                    this.mysqlConn.query(query, [karyawan.kkd_id_karyawan,perusahaan.kkd_id_perusahaan], (err,res)=>{
                        if(err){
                            reject(err)
                            return
                        }

                        resolve(SUCCESS)
                    })
                })
            }

            else {
                reject(MISMATCH_OBJ_TYPE)
            }
        })
    }*/
    //delete this part of the code only after you've been given permission to do so

}