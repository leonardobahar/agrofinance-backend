export class Karyawan{
    constructor(k_id_karyawan, k_nama_lengkap, k_posisi, k_nik, k_role, k_masih_hidup) {
        this.k_id_karyawan=k_id_karyawan
        this.k_nama_lengkap=k_nama_lengkap
        this.k_posisi=k_posisi
        this.k_nik=k_nik
        this.k_role=k_role
        this.k_masih_hidup=k_masih_hidup
    }
}

export class Karyawan_kerja_dimana{
    constructor(kkd_id_karyawan_kerja_dimana, kkd_id_karyawan, kkd_id_cabang_perusahaan){
        this.kkd_id_karyawan_kerja_dimana=kkd_id_karyawan_kerja_dimana
        this.kkd_id_karyawan=kkd_id_karyawan
        this.kkd_id_cabang_perusahaan=kkd_id_cabang_perusahaan
    }
}

export class Kategori_transaksi{
    constructor(kt_id_kategori, kt_nama_kategori) {
        this.kt_id_kategori=kt_id_kategori
        this.kt_nama_kategori=kt_nama_kategori
    }
}

export class Perusahaan{
    constructor(p_id_perusahaan,p_nama_perusahaan){
        this.p_id_perusahaan=p_id_perusahaan
        this.p_nama_perusahaan=p_nama_perusahaan
    }
}

export class Cabang_perusahaan{
    constructor(cp_id_cabang, cp_nama_cabang, cp_perusahaan_id, cp_lokasi, cp_alamat_lengkap, cp_is_default) {
        this.cp_id_cabang=cp_id_cabang
        this.cp_nama_cabang=cp_nama_cabang
        this.cp_perusahaan_id=cp_perusahaan_id
        this.cp_lokasi=cp_lokasi
        this.cp_alamat_lengkap=cp_alamat_lengkap
        this.cp_is_default=cp_is_default
    }
}

export class Rekening_perusahaan{
    constructor(rp_id_rekening, rp_nama_bank, rp_nomor_rekening, rp_saldo, rp_rekening_utama, rp_id_cabang_perusahaan, rp_perusahaan_id) {
        this.rp_id_rekening=rp_id_rekening
        this.rp_nama_bank=rp_nama_bank
        this.rp_nomor_rekening=rp_nomor_rekening
        this.rp_saldo=rp_saldo
        this.rp_rekening_utama=rp_rekening_utama
        this.rp_id_cabang_perusahaan=rp_id_cabang_perusahaan
        this.rp_perusahaan_id=rp_perusahaan_id
    }
}

export class Transaksi_rekening{
    constructor(tr_id_transaksi_rekening, tr_timestamp_transaksi, tr_credit, tr_debit, tr_id_transaksi) {
        this.tr_id_transaksi_rekening=tr_id_transaksi_rekening
        this.tr_timestamp_transaksi=tr_timestamp_transaksi
        this.tr_credit=tr_credit
        this.tr_debit=tr_debit
        this.tr_id_transaksi=tr_id_transaksi
    }
}

export class Transaksi{
    constructor(t_id_transaksi, t_tanggal_transaksi, t_tanggal_modifikasi, t_tanggal_realisasi, t_is_rutin,  t_status, t_bon_sementara, t_rekening_penanggung_utama, t_id_cabang_perusahaan, t_id_karyawan, t_is_deleted,
                detail_transaksi, td_id_detil_transaksi, td_jumlah, td_id_kategori_transaksi, td_bpu_attachment, td_debit_credit, td_nomor_bukti_transaksi, td_file_bukti_transaksi, skema_pembebanan_json, td_is_deleted){
        this.t_id_transaksi=t_id_transaksi
        this.t_tanggal_transaksi=t_tanggal_transaksi
        this.t_tanggal_modifikasi=t_tanggal_modifikasi
        this.t_tanggal_realisasi=t_tanggal_realisasi
        this.t_is_rutin=t_is_rutin
        this.t_status=t_status
        this.t_bon_sementara=t_bon_sementara
        this.t_rekening_penanggung_utama=t_rekening_penanggung_utama
        this.t_id_cabang_perusahaan=t_id_cabang_perusahaan
        this.t_id_karyawan=t_id_karyawan
        this.t_is_deleted=t_is_deleted
        this.detail_transaksi=detail_transaksi
        this.td_id_detil_transaksi=td_id_detil_transaksi
        this.td_jumlah=td_jumlah
        this.td_id_kategori_transaksi=td_id_kategori_transaksi
        this.td_bpu_attachment=td_bpu_attachment
        this.td_debit_credit=td_debit_credit
        this.td_nomor_bukti_transaksi=td_nomor_bukti_transaksi
        this.td_file_bukti_transaksi=td_file_bukti_transaksi
        this.skema_pembebanan_json=skema_pembebanan_json
        this.td_is_deleted=td_is_deleted
    }
}

export class Detil_transaksi{
    constructor(td_id_detil_transaksi, td_id_transaksi, td_jumlah, td_id_kategori_transaksi, td_bpu_attachment,
                td_debit_credit, td_nomor_bukti_transaksi, td_file_bukti_transaksi, skema_pembebanan_json, td_is_deleted) {
        this.td_id_detil_transaksi=td_id_detil_transaksi
        this.td_id_transaksi=td_id_transaksi
        this.td_jumlah=td_jumlah
        this.td_id_kategori_transaksi=td_id_kategori_transaksi
        this.td_bpu_attachment=td_bpu_attachment
        this.td_debit_credit=td_debit_credit
        this.td_nomor_bukti_transaksi=td_nomor_bukti_transaksi
        this.td_file_bukti_transaksi=td_file_bukti_transaksi
        this.skema_pembebanan_json=skema_pembebanan_json
        this.td_is_deleted=td_is_deleted
    }
}
