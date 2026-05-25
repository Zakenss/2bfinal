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

function line(label: string, value: string): string {
  return `
  <p style="margin:0 0 4px;font-size:10px;">
    <span>${label}</span>
    <span style="float:right;text-align:right;max-width:55%;">${value}</span>
  </p>`
}

function blockTitle(text: string): string {
  return `<p style="margin:10px 0 4px;font-size:9px;letter-spacing:1px;text-transform:uppercase;">${text}</p>`
}

export function buildReceiptHTML(data: ReceiptData): string {
  const baseDate = data.created_at ? new Date(data.created_at) : new Date()
  const dateStr = baseDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = baseDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const multiChild = data.children.length > 1
  const avanceNum = typeof data.avance === 'string' ? parseFloat(data.avance) : (data.avance ?? 0)

  const codeBlocks = data.children.map((child, i) => {
    const label = multiChild ? `Enfant ${i + 1}` : 'Code'
    return `
    <p style="margin:8px 0 2px;font-size:9px;text-transform:uppercase;">${label}</p>
    <p style="margin:0 0 4px;font-size:26px;letter-spacing:6px;text-align:center;">${child.code}</p>
    ${multiChild ? `<p style="margin:0 0 6px;font-size:9px;text-align:center;">${child.ecole} — ${child.niveau}</p>` : ''}`
  }).join('')

  const childDetails = data.children.map((child, i) => {
    const genre = child.genre === 'fille' ? 'Fille' : child.genre === 'garcon' ? 'Garçon' : (child.genre || '—')
    const label = multiChild ? `Enfant ${i + 1}` : 'Enfant'
    return `
    ${blockTitle(label)}
    ${line('École', child.ecole)}
    ${line('Niveau', child.niveau)}
    ${line('Genre', genre)}
    ${line('Code', child.code)}`
  }).join('')

  const couvertureSection = data.couverture_demandee
    ? `${blockTitle('Couverture')}${line('Couverture', 'Demandée')}`
    : ''

  const avanceSection = avanceNum && avanceNum > 0
    ? `${blockTitle('Avance')}${line('Avance', `${avanceNum} DHS`)}`
    : ''

  const noteSection = data.note
    ? `${blockTitle('Note')}<p style="margin:0 0 6px;font-size:10px;line-height:1.4;">${data.note}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Reçu — ${data.nom}</title>
  <style>
    @page { size: 75mm auto; margin: 3mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-weight: bold; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px;
      line-height: 1.35;
      color: #000;
      background: #fff;
      width: 69mm;
      padding: 2mm;
    }
    @media print {
      body { width: 100%; }
    }
  </style>
</head>
<body>

  <p style="margin:0 0 8px;font-size:16px;letter-spacing:2px;text-align:center;">LIBRAIRIE 2B</p>

  <p style="margin:0 0 8px;font-size:9px;display:flex;justify-content:space-between;">
    <span>${dateStr}</span>
    <span>${timeStr}</span>
  </p>

  <p style="margin:0 0 10px;font-size:10px;text-align:center;text-transform:uppercase;">Commande confirmée</p>

  ${codeBlocks}

  ${blockTitle('Détails')}
  ${line('Nom', data.nom)}
  ${data.telephone ? line('Tél', data.telephone) : ''}

  ${childDetails}
  ${couvertureSection}
  ${avanceSection}
  ${noteSection}

  <p style="margin:12px 0 0;padding-top:8px;border-top:1px solid #000;font-size:9px;text-align:center;">Merci pour votre confiance !</p>

</body>
</html>`
}
