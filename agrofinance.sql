CREATE DATABASE IF NOT EXISTS `agrofinance` DEFAULT CHARACTER SET utf8;

CREATE SCHEMA IF NOT EXISTS `agrofinance` DEFAULT CHARACTER SET utf8 ;
USE `agrofinance` ;

CREATE TABLE IF NOT EXISTS `agrofinance`.`kategori_transaksi` (
  `kt_id_kategori` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `kt_nama_kategori` VARCHAR(255) NOT NULL);

CREATE TABLE IF NOT EXISTS `agrofinance`.`transaksi`(
    `t_id_transaksi` INT(7) PRIMARY KEY AUTO_INCREMENT,
    `t_tanggal_transaksi` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `t_tanggal_modifikasi` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `t_tanggal_realisasi` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `t_is_rutin` TINYINT(1) NOT NULL DEFAULT 0,
    `t_status` VARCHAR(45) NOT NULL,
    `t_bon_sementara` VARCHAR(45) NOT NULL,
    `t_id_perusahaaan` INT(7),
    `t_is_deleted` TINYINT(1) DEFAULT 0,
    FOREIGN KEY (`t_id_perusahaaan`) REFERENCES `agrofinance`.`perusahaan`(`p_id_perusahaan`)
);

CREATE TABLE IF NOT EXISTS `agrofinance`.`detil_transaksi` (
  `td_id_detil_transaksi` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `td_id_transaksi` INT(7),
  `td_jumlah` FLOAT NOT NULL,
  `td_id_kategori_transaksi` INT(7) NOT NULL,
  `td_jenis` VARCHAR(45) NOT NULL DEFAULT 'KAS',
  `td_bpu_attachment` VARCHAR(45) NOT NULL,
  `td_debit_credit` TINYINT(1) NOT NULL DEFAULT 0,
  `td_nomor_bukti_transaksi` VARCHAR(45) NOT NULL,
  `td_file_bukti_transaksi` VARCHAR(45) NOT NULL,
  `skema_pembebanan_json` LONGTEXT NOT NULL,
  `td_is_deleted` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`td_id_kategori_transaksi`) REFERENCES kategori_transaksi(`kt_id_kategori`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`td_id_transaksi`) REFERENCES transaksi(`t_id_transaksi`) ON DELETE CASCADE ON UPDATE CASCADE
  );

CREATE TABLE IF NOT EXISTS `agrofinance`.`perusahaan` (
  `p_id_perusahaan` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `p_nama_perusahaan` VARCHAR(255) NOT NULL,
  `p_alamat` TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS `agrofinance`.`karyawan` (
  `k_id_karyawan` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `k_nama_lengkap` VARCHAR(255) UNIQUE NOT NULL,
  `k_posisi` VARCHAR(45) NOT NULL,
  `k_nik` VARCHAR(255) UNIQUE NOT NULL,
  `k_role` VARCHAR(45) NOT NULL,
  `k_masih_hidup` TINYINT(1) NULL);

CREATE TABLE IF NOT EXISTS `agrofinance`.`karyawan_kerja_dimana` (
  `kkd_id_karyawan_kerja_dimana` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `kkd_id_karyawan` INT(7) NOT NULL,
  `kkd_id_perusahaan` INT(7) NOT NULL,
  FOREIGN KEY (`kkd_id_karyawan`) REFERENCES karyawan(`k_id_karyawan`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`kkd_id_perusahaan`) REFERENCES perusahaan(`p_id_perusahaan`) ON DELETE CASCADE ON UPDATE CASCADE);

CREATE TABLE IF NOT EXISTS `agrofinance`.`rekening_perusahaan` (
  `rp_id_rekening` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `rp_nama_bank` VARCHAR(225) NOT NULL,
  `rp_nomor_rekening` VARCHAR(225) NOT NULL,
  `rp_saldo` VARCHAR(255) NOT NULL,
  `rp_rekening_utama`TINYINT(1) DEFAULT 0,
  `rp_id_perusahaan` INT(7) NOT NULL,
  FOREIGN KEY (`rp_id_perusahaan`) REFERENCES perusahaan(`p_id_perusahaan`) ON DELETE CASCADE ON UPDATE CASCADE);

CREATE TABLE IF NOT EXISTS `agrofinance`.`transaksi_rekening` (
  `tr_id_transaksi_rekening` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `tr_timestamp_transaksi` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `tr_credit` TINYINT(1) NOT NULL DEFAULT 0,
  `tr_debit` TINYINT(1) NOT NULL DEFAULT 0,
  `tr_id_transaksi` INT(7) NOT NULL,
  FOREIGN KEY (`tr_id_transaksi`) REFERENCES transaksi(`t_id_transaksi`) ON DELETE CASCADE ON UPDATE CASCADE);

CREATE TABLE IF NOT EXISTS `agrofinance`.`cabang_perusahaan`(
	`cp_id_cabang` INT(7) PRIMARY KEY AUTO_INCREMENT,
    `cp_nama_cabang` VARCHAR(225) NOT NULL,
    `cp_perusahaan_id` INT(7) NOT NULL,
    `cp_lokasi` VARCHAR(225) NOT NULL,
    `cp_alamat_lengkap` VARCHAR(225) NOT NULL,
    `cp_is_default` TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (`cp_perusahaan_id`) REFERENCES perusahaan(`p_id_perusahaan`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `agrofinance`.`list_bank`(
    `lb_id_list` INT(7) PRIMARY KEY AUTO_INCREMENT,
    `lb_kode_bank` VARCHAR(255) UNIQUE NOT NULL,
    `lb_nama_bank` VARCHAR(255) UNIQUE NOT NULL
);