CREATE DATABASE IF NOT EXISTS `agrofinance` DEFAULT CHARACTER SET utf8;

CREATE SCHEMA IF NOT EXISTS `agrofinance` DEFAULT CHARACTER SET utf8 ;
USE `agrofinance` ;

CREATE TABLE IF NOT EXISTS `agrofinance`.`kategori_transaksi` (
  `kt_id_kategori` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `kt_nama_kategori` VARCHAR(255) NOT NULL);

CREATE TABLE IF NOT EXISTS `agrofinance`.`transaksi` (
  `t_id_transaksi` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `t_jumlah` FLOAT NOT NULL,
  `t_id_kategori_transaksi` INT(7) NOT NULL,
  `t_jenis` VARCHAR(45) NOT NULL DEFAULT 'KAS',
  `t_bpu_attachment` VARCHAR(45) NOT NULL,
  `t_debit_credit` TINYINT(1) NOT NULL DEFAULT 0,
  `t_status` VARCHAR(45) NOT NULL,
  `t_bon_sementara` VARCHAR(45) NOT NULL,
  `t_is_rutin` TINYINT(1) NOT NULL DEFAULT 0,
  `t_tanggal_transaksi` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `t_tanggal_modifikasi` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `t_tanggal_realisasi` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `t_nomor_bukti_transaksi` VARCHAR(45) NOT NULL,
  `t_file_bukti_transaksi` VARCHAR(45) NOT NULL,
  `t_pembebanan_id` INT(7) NOT NULL,
  FOREIGN KEY (`t_id_kategori_transaksi`) REFERENCES kategori_transaksi(`kt_id_kategori`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`t_pembebanan_id`) REFERENCES pembebanan(`pbb_id`) ON DELETE CASCADE ON UPDATE CASCADE);

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

CREATE TABLE IF NOT EXISTS `agrofinance`.`pembebanan` (
  `pbb_id` INT(7) PRIMARY KEY AUTO_INCREMENT,
  `skema_pembebanan_json` LONGTEXT NOT NULL);