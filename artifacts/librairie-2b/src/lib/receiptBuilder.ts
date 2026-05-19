export interface ReceiptChild {
  ecole: string
  niveau: string
  genre?: string | null
  code: string
}

export interface ReceiptData {
  nom: string
  telephone?: string | null
  avance?: number | string | null
  note?: string | null
  couverture_demandee?: boolean
  children: ReceiptChild[]
  created_at?: string
}

function sectionHeader(label: string): string {
  return `
  <div style="display:flex;align-items:center;margin:5px 0 3px;">
    <div style="flex:1;height:1px;background:#bbb;"></div>
    <div style="padding:0 5px;font-size:7px;font-weight:bold;letter-spacing:1.5px;color:#111;">${label}</div>
    <div style="flex:1;height:1px;background:#bbb;"></div>
  </div>`
}

function row(label: string, value: string, valueStyle = ''): string {
  return `
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;font-size:8.5px;">
    <span style="color:#111;white-space:nowrap;">${label}</span>
    <span style="text-align:right;word-break:break-word;flex:1;margin-left:6px;font-weight:600;${valueStyle}">${value}</span>
  </div>`
}

export function buildReceiptHTML(data: ReceiptData): string {
  const baseDate = data.created_at ? new Date(data.created_at) : new Date()
  const dateStr = baseDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = baseDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const multiChild = data.children.length > 1
  const avanceNum = typeof data.avance === 'string' ? parseFloat(data.avance) : (data.avance ?? 0)

  const childBoxes = data.children.map((child, i) => {
    const label = multiChild ? `ENFANT ${i + 1}` : 'CODE DE R&Eacute;F&Eacute;RENCE'
    return `
    <div style="border:1.5px solid #222;margin:5px 0;padding:5px 4px;text-align:center;">
      <div style="font-size:6.5px;letter-spacing:2px;color:#111;text-transform:uppercase;margin-bottom:3px;">${label}</div>
      <div style="font-family:'Courier New',Courier,monospace;font-size:24px;font-weight:900;letter-spacing:8px;line-height:1;color:#111;">${child.code}</div>
      ${multiChild ? `<div style="font-size:7px;color:#111;margin-top:3px;letter-spacing:0.5px;">${child.ecole} &mdash; ${child.niveau}</div>` : ''}
    </div>`
  }).join('')

  const childDetails = data.children.map((child, i) => {
    const genre = child.genre === 'fille' ? 'Fille' : child.genre === 'garcon' ? 'Gar\u00e7on' : (child.genre || '\u2014')
    const label = multiChild ? `ENFANT ${i + 1}` : 'ENFANT'
    return `
    ${sectionHeader(label)}
    ${row('\u00c9cole', child.ecole)}
    ${row('Niveau', child.niveau)}
    ${row('Genre', genre)}
    ${row('Code', child.code, "font-family:'Courier New',Courier,monospace;letter-spacing:2px;")}`
  }).join('')

  const couvertureSection = data.couverture_demandee
    ? `${sectionHeader('COUVERTURE')}${row('Couverture', 'DEMAND\u00c9E', 'font-weight:bold;')}`
    : ''

  const avanceSection = avanceNum && avanceNum > 0
    ? `${sectionHeader('AVANCE')}${row('Avance', `${avanceNum} DHS`, 'font-weight:bold;color:#1a7a3c;')}`
    : ''

  const noteSection = data.note
    ? `${sectionHeader('NOTE')}
    <div style="font-size:8px;color:#333;word-break:break-word;line-height:1.4;padding:0 1px;">${data.note}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Re&ccedil;u &mdash; ${data.nom}</title>
  <style>
    @page { size: 75mm auto; margin: 2mm 3mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 8.5px;
      line-height: 1.35;
      color: #111;
      background: #fff;
      width: 69mm;
      padding: 1mm 3mm 1mm 0;
    }
    @media print {
      body { width: 100%; padding-right: 3mm; }
    }
  </style>
</head>
<body>

  <!-- ── HEADER ── -->
  <div style="border-top:3px double #111;border-bottom:3px double #111;padding:5px 0;text-align:center;margin-bottom:6px;">
    <div style="font-size:15px;font-weight:900;letter-spacing:3px;line-height:1;">ESPACE BEN ALI</div>
    <div style="font-size:7px;letter-spacing:2.5px;color:#111;margin-top:2px;text-transform:uppercase;">Librairie Scolaire</div>
  </div>

  <!-- ── DATE / TIME ── -->
  <div style="display:flex;justify-content:space-between;font-size:7.5px;color:#111;margin-bottom:5px;">
    <span>${dateStr}</span>
    <span>${timeStr}</span>
  </div>

  <!-- ── CONFIRMATION ── -->
  <div style="text-align:center;margin-bottom:6px;">
    <div style="display:inline-block;border:1.5px solid #111;border-radius:2px;padding:3px 10px;">
      <span style="font-size:8px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">&#10003;&nbsp; Commande Confirm&eacute;e</span>
    </div>
  </div>

  <!-- ── CODE BOX(ES) ── -->
  ${childBoxes}

  <!-- ── DETAILS SECTION ── -->
  ${sectionHeader('D&Eacute;TAILS')}
  ${row('Nom', data.nom)}
  ${data.telephone ? row('T&eacute;l', data.telephone) : ''}

  ${childDetails}
  ${couvertureSection}
  ${avanceSection}
  ${noteSection}

  <!-- ── FOOTER ── -->
  <div style="border-top:3px double #111;margin-top:7px;padding-top:5px;text-align:center;">
    <div style="font-size:8px;color:#111;letter-spacing:0.5px;">Merci pour votre confiance&nbsp;!</div>
  </div>

</body>
</html>`
}
