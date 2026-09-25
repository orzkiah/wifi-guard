import zipfile
import os

def create_docx(filename):
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    android_codes = [
        ("1", "AND-7491-K9", "Android (APK)", "Aktif (1x Unduh)"),
        ("2", "AND-3820-M4", "Android (APK)", "Aktif (1x Unduh)"),
        ("3", "AND-9154-P7", "Android (APK)", "Aktif (1x Unduh)"),
        ("4", "AND-6208-T2", "Android (APK)", "Aktif (1x Unduh)"),
        ("5", "AND-4371-X5", "Android (APK)", "Aktif (1x Unduh)"),
        ("6", "AND-8592-W3", "Android (APK)", "Aktif (1x Unduh)"),
        ("7", "AND-1746-Q8", "Android (APK)", "Aktif (1x Unduh)"),
        ("8", "AND-5930-R1", "Android (APK)", "Aktif (1x Unduh)"),
        ("9", "AND-2683-V6", "Android (APK)", "Aktif (1x Unduh)"),
        ("10", "AND-9017-Z4", "Android (APK)", "Aktif (1x Unduh)")
    ]

    windows_codes = [
        ("1", "WIN-8319-A5", "Windows Desktop", "Aktif (1x Unduh)"),
        ("2", "WIN-4720-B8", "Windows Desktop", "Aktif (1x Unduh)"),
        ("3", "WIN-9541-C2", "Windows Desktop", "Aktif (1x Unduh)"),
        ("4", "WIN-2168-D7", "Windows Desktop", "Aktif (1x Unduh)"),
        ("5", "WIN-6395-E3", "Windows Desktop", "Aktif (1x Unduh)"),
        ("6", "WIN-1804-F9", "Windows Desktop", "Aktif (1x Unduh)"),
        ("7", "WIN-7532-G1", "Windows Desktop", "Aktif (1x Unduh)"),
        ("8", "WIN-3947-H6", "Windows Desktop", "Aktif (1x Unduh)"),
        ("9", "WIN-8270-J4", "Windows Desktop", "Aktif (1x Unduh)"),
        ("10", "WIN-5163-K8", "Windows Desktop", "Aktif (1x Unduh)")
    ]

    def build_table(headers, rows):
        xml = """<w:tbl>
          <w:tblPr>
            <w:tblW w:w="9200" w:type="dxa"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>
              <w:left w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>
              <w:bottom w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>
              <w:right w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
              <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            </w:tblBorders>
            <w:tblCellMar>
              <w:top w:w="120" w:type="dxa"/>
              <w:left w:w="180" w:type="dxa"/>
              <w:bottom w:w="120" w:type="dxa"/>
              <w:right w:w="180" w:type="dxa"/>
            </w:tblCellMar>
          </w:tblPr>"""

        # Header Row
        xml += "<w:tr><w:trPr><w:tblHeader/></w:trPr>"
        for h in headers:
            xml += f"""<w:tc>
              <w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr>
              <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
                <w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr>
                  <w:t>{h}</w:t>
                </w:r>
              </w:p>
            </w:tc>"""
        xml += "</w:tr>"

        # Data Rows
        for r_idx, r in enumerate(rows):
            bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            xml += "<w:tr>"
            for c_idx, cell in enumerate(r):
                align = "center" if c_idx in (0, 2, 3) else "left"
                is_bold = (c_idx == 1)
                color = "0284C7" if c_idx == 1 else "334155"
                font_name = "Consolas" if c_idx == 1 else "Arial"
                xml += f"""<w:tc>
                  <w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{bg_color}"/></w:tcPr>
                  <w:p><w:pPr><w:jc w:val="{align}"/></w:pPr>
                    <w:r><w:rPr><w:rFonts w:ascii="{font_name}" w:hAnsi="{font_name}"/>{"<w:b/>" if is_bold else ""}<w:color w:val="{color}"/><w:sz w:val="20"/></w:rPr>
                      <w:t>{cell}</w:t>
                    </w:r>
                  </w:p>
                </w:tc>"""
            xml += "</w:tr>"

        xml += "</w:tbl>"
        return xml

    table_headers = ["No", "Kode Akses Unduhan", "Platform", "Status Kuota"]
    android_table_xml = build_table(table_headers, android_codes)
    windows_table_xml = build_table(table_headers, windows_codes)

    doc_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Header Title -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="0F172A"/></w:rPr>
        <w:t>KODE AKSES RESMI PENGUNDUHAN APLIKASI</w:t>
      </w:r>
    </w:p>

    <!-- Subtitle -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="300"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0284C7"/></w:rPr>
        <w:t>WIFI GUARD - ACCESS &amp; DEVICE SHIELD</w:t>
      </w:r>
    </w:p>

    <!-- Meta / Info Box -->
    <w:p>
      <w:pPr><w:spacing w:after="120"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="1E293B"/></w:rPr>
        <w:t>Informasi Batas Kuota &amp; Validasi:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="360"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="475569"/></w:rPr>
        <w:t>• Target Pengujian: Dibatasi maksimal 10 pengunduh untuk Android &amp; 10 pengunduh untuk Windows (Total 20 slot).</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="360"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="475569"/></w:rPr>
        <w:t>• Sistem Kuota Real-time: Setiap kode akses hanya dapat digunakan 1x untuk mengunduh. Begitu kode berhasil diverifikasi, slot kuota di website otomatis berkurang secara langsung (real-time).</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="360"/><w:spacing w:after="300"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="475569"/></w:rPr>
        <w:t>• Tautan Situs Resmi: https://orzkiah.github.io/wifi-guard/</w:t>
      </w:r>
    </w:p>

    <!-- Section 1: Android Table -->
    <w:p>
      <w:pPr><w:spacing w:before="200" w:after="140"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0F172A"/></w:rPr>
        <w:t>1. Daftar 10 Kode Akses Android (APK)</w:t>
      </w:r>
    </w:p>
    {android_table_xml}

    <!-- Spacing -->
    <w:p><w:pPr><w:spacing w:before="300"/></w:pPr></w:p>

    <!-- Section 2: Windows Table -->
    <w:p>
      <w:pPr><w:spacing w:before="200" w:after="140"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0F172A"/></w:rPr>
        <w:t>2. Daftar 10 Kode Akses Windows Desktop (Installer .exe)</w:t>
      </w:r>
    </w:p>
    {windows_table_xml}

    <!-- Guide Section -->
    <w:p>
      <w:pPr><w:spacing w:before="360" w:after="140"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0F172A"/></w:rPr>
        <w:t>Cara Penggunaan Kode oleh Penguji:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="360"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr>
        <w:t>1. Buka laman landing page resmi di peramban (browser): https://orzkiah.github.io/wifi-guard/</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="360"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr>
        <w:t>2. Klik tombol "Unduh Android" atau "Unduh Windows".</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="360"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr>
        <w:t>3. Masukkan 1 kode unik di atas pada modal verifikasi yang muncul.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:ind w:left="360"/><w:spacing w:after="120"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr>
        <w:t>4. Tekan tombol "Verifikasi &amp; Mulai Unduh". Berkas akan terunduh otomatis dan kuota akan terpotong secara permanen.</w:t>
      </w:r>
    </w:p>

    <!-- Footer Note -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="400" w:after="100"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="94A3B8"/></w:rPr>
        <w:t>Dokumen Resmi Kuota Terbatas WiFi Guard • Dibuat Khusus untuk Pengujian Tertutup</w:t>
      </w:r>
    </w:p>

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>"""

    with zipfile.ZipFile(filename, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", rels)
        z.writestr("word/document.xml", doc_xml)

    print(f"Berhasil membuat dokumen DOCX: {filename} (Ukuran: {os.path.getsize(filename)} bytes)")

if __name__ == "__main__":
    out_file = os.path.join(os.getcwd(), "Kode_Akses_Download_WiFi_Guard.docx")
    create_docx(out_file)
    docs_out = os.path.join(os.getcwd(), "docs", "Kode_Akses_Download_WiFi_Guard.docx")
    create_docx(docs_out)
