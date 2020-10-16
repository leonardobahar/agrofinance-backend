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

export class Transaksi{
    constructor(t_id_transaksi, t_jumlah, t_id_kategori_transaksi, t_jenis, t_bpu_attachment, t_debit_card, t_status, t_bon_sementara, t_is_rutin, t_tanggal_transaksi, t_tanggal_modifikasi, t_tanggal_realisasi, t_nomor_bukti_transaksi, t_file_bukti_transaksi, t_pembebanan_id){
        this.t_id_transaksi=t_id_transaksi
        this.t_jumlah=t_jumlah
        this.t_id_kategori_transaksi=t_id_kategori_transaksi
        this.t_jenis=t_jenis
        this.t_bpu_attachment=t_bpu_attachment
        this.t_debit_card=t_debit_card
        this.t_status=t_status
        this.t_bon_sementara=t_bon_sementara
        this.t_is_rutin=t_is_rutin
        this.t_tanggal_transaksi=t_tanggal_transaksi
        this.t_tanggal_modifikasi=t_tanggal_modifikasi
        this.t_tanggal_realisi=t_tanggal_realisasi
        this.t_nomor_bukti_transaksi=t_nomor_bukti_transaksi
        this.t_file_bukti_transaksi=t_file_bukti_transaksi
        this.t_pembebanan_id=t_pembebanan_id
    }
}