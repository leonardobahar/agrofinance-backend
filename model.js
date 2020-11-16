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
    constructor(kkd_id_karyawan_kerja_dimana, kkd_id_karyawan, kkd_id_perusahaan){
        this.kkd_id_karyawan_kerja_dimana=kkd_id_karyawan_kerja_dimana
        this.kkd_id_karyawan=kkd_id_karyawan
        this.kkd_id_perusahaan=kkd_id_perusahaan
    }
}

export class Kategori_transaksi{
    constructor(kt_id_kategori, kt_nama_kategori) {
        this.kt_id_kategori=kt_id_kategori
        this.kt_nama_kategori=kt_nama_kategori
    }
}

export class Pembebanan{
    constructor(pbb_id,skema_pembebanan_json) {
        this.pbb_id=pbb_id
        this.skema_pembebanan_json=skema_pembebanan_json
    }
}

export class Perusahaan{
    constructor(p_id_perusahaan,p_nama_perusahaan,p_alamat){
        this.p_id_perusahaan=p_id_perusahaan
        this.p_nama_perusahaan=p_nama_perusahaan
        this.p_alamat=p_alamat
    }
}

export class Rekening_perusahaan{
    constructor(rp_id_rekening, rp_nama_bank, rp_nomor_rekening, rp_saldo, rp_id_perusahaan) {
        this.rp_id_rekening=rp_id_rekening
        this.rp_nama_bank=rp_nama_bank
        this.rp_nomor_rekening=rp_nomor_rekening
        this.rp_saldo=rp_saldo
        this.rp_id_perusahaan=rp_id_perusahaan
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
    constructor(t_id_transaksi, t_tanggal_transaksi, t_tanggal_modifikasi, t_tanggal_realisasi, t_is_rutin,  t_status, t_bon_sementara, t_is_deleted,
                td_id_detil_transaksi, td_jumlah, td_id_kategori_transaksi, td_jenis, td_bpu_attachment, td_debit_credit, td_nomor_bukti_transaksi, td_file_bukti_transaksi, td_pembebanan_id, td_is_deleted){
        this.t_id_transaksi=t_id_transaksi
        this.t_tanggal_transaksi=t_tanggal_transaksi
        this.t_tanggal_modifikasi=t_tanggal_modifikasi
        this.t_tanggal_realisasi=t_tanggal_realisasi
        this.t_is_rutin=t_is_rutin
        this.t_status=t_status
        this.t_bon_sementara=t_bon_sementara
        this.t_is_deleted=t_is_deleted
        this.td_id_detil_transaksi=td_id_detil_transaksi
        this.td_jumlah=td_jumlah
        this.td_id_kategori_transaksi=td_id_kategori_transaksi
        this.td_jenis=td_jenis
        this.td_bpu_attachment=td_bpu_attachment
        this.td_debit_credit=td_debit_credit
        this.td_nomor_bukti_transaksi=td_nomor_bukti_transaksi
        this.td_file_bukti_transaksi=td_file_bukti_transaksi
        this.td_pembebanan_id=td_pembebanan_id
        this.td_is_deleted=td_is_deleted
    }
}

export class Detil_transaksi{
    constructor(td_id_detil_transaksi, td_id_transaksi, td_jumlah, td_id_kategori_transaksi, td_jenis, td_bpu_attachment,
                td_debit_credit, td_nomor_bukti_transaksi, td_file_bukti_transaksi, td_pembebanan_id, td_is_deleted) {
        this.td_id_detil_transaksi=td_id_detil_transaksi
        this.td_id_transaksi=td_id_transaksi
        this.td_jumlah=td_jumlah
        this.td_id_kategori_transaksi=td_id_kategori_transaksi
        this.td_jenis=td_jenis
        this.td_bpu_attachment=td_bpu_attachment
        this.td_debit_credit=td_debit_credit
        this.td_nomor_bukti_transaksi=td_nomor_bukti_transaksi
        this.td_file_bukti_transaksi=td_file_bukti_transaksi
        this.td_pembebanan_id=td_pembebanan_id
        this.td_is_deleted=td_is_deleted
    }
}

/*
{
            is_rutin
            status
            bon_sementara:
            detil: [{
                jumlah:
                id_kategori_transaksi
                jenis:
                bpu_attachment
                debit_credit
                nomor_bukti_transaksi
                file_bukti_transaksi
                pembebanan_id
            },{
                jumlah:

                id_kategori_transaksi
                jenis:
                bpu_attachment
                debit_credit
                nomor_bukti_transaksi
                file_bukti_transaksi
                pembebanan_id
            }]
}
 */