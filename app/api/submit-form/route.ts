import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const timestampStr = new Date().getTime();
    const fileNameRumah = `Rumah_${body.nik}_${timestampStr}.jpg`;
    const fileNameTamu = `Tamu_${body.nik}_${timestampStr}.jpg`;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

    let linkFotoRumah = '-';
    let linkFotoRuangTamu = '-';

    // 1. UPLOAD FOTO VIA GOOGLE APPS SCRIPT (GAS)
    // Lewati proses ini jika form diisi oleh pengguna di luar Tabanan
// 1. UPLOAD FOTO VIA GOOGLE APPS SCRIPT (GAS)
    if (body.fotoRumah !== '-' && body.fotoRuangTamu !== '-') {
      // Bikin signal pembatalan custom biar gak gampang timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Naikkan batas sabar ke 30 detik

      const gasResponse = await fetch(process.env.GAS_UPLOAD_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: folderId,
          fotoRumah: body.fotoRumah,
          namaRumah: fileNameRumah,
          fotoRuangTamu: body.fotoRuangTamu,
          namaTamu: fileNameTamu
        }),
        signal: controller.signal // Pasang signal sabar di sini cuy
      });

      clearTimeout(timeoutId); // Bersihkan timeout kalau sukses sebelum 30 detik

      const gasData = await gasResponse.json();
      
      if (!gasData.success) {
        throw new Error("Gagal upload foto via GAS: " + gasData.error);
      }

      linkFotoRumah = gasData.data.linkFotoRumah || '-';
      linkFotoRuangTamu = gasData.data.linkFotoRuangTamu || '-';
    }

    // 2. SIMPAN DATA KE GOOGLE SHEETS VIA SERVICE ACCOUNT
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const formattedTimestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });

    const newRow = [
      formattedTimestamp,
      body.namaPegawai,
      `'${body.noKK}`,
      `'${body.nik}`,
      body.namaKepalaKeluarga,
      body.namaAnggotaKeluargaLain,
      body.asalOPD,
      `'${body.nip}`,
      `'${body.noHP}`,
      body.email || '-',
      body.alamatLengkap,
      body.kabupaten,
      body.kecamatan,
      body.desa,
      body.slsBanjar,
      body.latitude,
      body.longitude,
      body.memilikiUsaha,
      body.noMeteranPLN,
      linkFotoRumah,
      linkFotoRuangTamu,
      body.sudahDidataSE
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:V',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    });

    return NextResponse.json({ success: true, message: 'Data & Foto Berhasil Tersimpan!' }, { status: 200 });
  } catch (error: any) {
    console.error('[Error Sistem Backend API]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}