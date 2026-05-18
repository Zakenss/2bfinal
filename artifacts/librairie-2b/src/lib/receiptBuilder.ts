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

export function buildReceiptHTML(data: ReceiptData): string {
  const baseDate = data.created_at ? new Date(data.created_at) : new Date()
  const dateStr = baseDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = baseDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const multiChild = data.children.length > 1
  const avanceNum = typeof data.avance === 'string' ? parseFloat(data.avance) : (data.avance ?? 0)

  const childBoxes = data.children.map((child, i) => {
    const label = multiChild ? `Enfant ${i + 1} :` : 'Votre code de r&eacute;f&eacute;rence :'
    return `
    <div style="margin-bottom:5px;">
      <div style="font-size:8px;color:#6b7280;margin-bottom:2px;">${label}</div>
      <div style="background:#dbeafe;border-radius:3px;padding:4px 3px;text-align:center;">
        <div style="font-family:monospace;font-weight:bold;font-size:20px;letter-spacing:6px;color:#1e3a8a;line-height:1.2;">${child.code}</div>
        ${multiChild ? `<div style="font-size:7.5px;color:#374151;margin-top:2px;">${child.ecole} &mdash; ${child.niveau}</div>` : ''}
      </div>
    </div>`
  }).join('')

  const childDetails = data.children.map((child, i) => {
    const genre = child.genre === 'fille' ? 'Fille' : child.genre === 'garcon' ? 'Gar\u00e7on' : (child.genre || '\u2014')
    const sectionLabel = multiChild ? `ENFANT ${i + 1}` : 'ENFANT'
    return `
    <div style="border-top:1px solid #d1d5db;padding-top:3px;margin-top:3px;">
      <div style="text-align:center;font-weight:bold;font-size:8.5px;margin-bottom:3px;">${sectionLabel}</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
        <span style="color:#6b7280;white-space:nowrap;">&#201;cole :</span>
        <span style="text-align:right;word-break:break-word;flex:1;margin-left:4px;">${child.ecole}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
        <span style="color:#6b7280;">Niveau :</span>
        <span style="margin-left:4px;">${child.niveau}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
        <span style="color:#6b7280;">Genre :</span>
        <span style="margin-left:4px;">${genre}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
        <span style="color:#6b7280;">Code :</span>
        <span style="font-family:monospace;font-weight:bold;letter-spacing:2px;margin-left:4px;">${child.code}</span>
      </div>
    </div>`
  }).join('')

  const couvertureRow = data.couverture_demandee
    ? `<div style="border-top:1px solid #d1d5db;padding-top:3px;margin-top:3px;display:flex;justify-content:space-between;">
        <span style="color:#6b7280;">Couverture :</span>
        <span style="font-weight:bold;">DEMAND&Eacute;E</span>
       </div>`
    : ''

  const avanceRow = avanceNum && avanceNum > 0
    ? `<div style="border-top:1px solid #d1d5db;padding-top:3px;margin-top:3px;display:flex;justify-content:space-between;">
        <span style="color:#6b7280;">Avance :</span>
        <span style="font-weight:bold;color:#16a34a;">${avanceNum} DHS</span>
       </div>`
    : ''

  const noteRow = data.note
    ? `<div style="border-top:1px solid #d1d5db;padding-top:3px;margin-top:3px;">
        <div style="font-weight:bold;margin-bottom:2px;">NOTE :</div>
        <div style="word-break:break-word;">${data.note}</div>
       </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Re&ccedil;u &mdash; ${data.nom}</title>
  <style>
    @page { size: 75mm auto; margin: 2mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 9px;
      line-height: 1.25;
      color: #000;
      background: #fff;
      width: 71mm;
      padding: 2mm;
    }
    @media print {
      body { width: 100%; padding: 0; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="text-align:center;margin-bottom:5px;">
    <div style="font-size:14px;font-weight:bold;letter-spacing:1px;">LIBRAIRIE 2B</div>
    <div style="font-size:8px;color:#6b7280;margin-top:1px;">${dateStr} &bull; ${timeStr}</div>
  </div>

  <!-- Commande Confirmée -->
  <div style="text-align:center;margin-bottom:6px;">
    <span style="display:inline-block;width:16px;height:16px;border-radius:50%;border:1.5px solid #374151;line-height:15px;font-size:9px;margin-right:3px;">&#10003;</span>
    <span style="font-size:9px;font-weight:bold;">Commande Confirm&eacute;e</span>
  </div>

  <!-- Child code boxes -->
  ${childBoxes}

  <!-- DÉTAILS section -->
  <div style="background:#f9fafb;border-radius:3px;padding:4px;margin-top:5px;border-top:1px solid #e5e7eb;">
    <div style="text-align:center;font-weight:bold;font-size:9px;text-decoration:underline;margin-bottom:4px;">D&Eacute;TAILS</div>

    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
      <span style="color:#6b7280;white-space:nowrap;">Nom :</span>
      <span style="text-align:right;word-break:break-word;flex:1;margin-left:4px;">${data.nom}</span>
    </div>
    ${data.telephone ? `<div style="display:flex;justify-content:space-between;margin-bottom:2px;">
      <span style="color:#6b7280;">T&eacute;l :</span>
      <span style="margin-left:4px;">${data.telephone}</span>
    </div>` : ''}

    ${childDetails}
    ${couvertureRow}
    ${avanceRow}
    ${noteRow}
  </div>

  <!-- Footer -->
  <div style="border-top:2px solid #9ca3af;margin-top:6px;padding-top:4px;text-align:center;font-size:8px;color:#6b7280;">
    Merci pour votre confiance&nbsp;!
  </div>

</body>
</html>`
}
