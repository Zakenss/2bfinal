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
  <div class="row">
    <span class="label">${label}</span>
    <span class="value">${value}</span>
  </div>`
}

function blockTitle(text: string): string {
  return `<p class="section-title">${text}</p>`
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
    <p class="code-label">${label}</p>
    <p class="code-value">${child.code}</p>
    ${multiChild ? `<p class="code-meta">${child.ecole} — ${child.niveau}</p>` : ''}`
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
    ? `${blockTitle('Note')}<p class="note-text">${data.note}</p>`
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
      line-height: 1.45;
      color: #000;
      background: #fff;
      width: 69mm;
      padding: 3mm 2mm;
    }
    @media print {
      body { width: 100%; }
    }
    .store-name {
      margin: 0 0 10px;
      font-size: 16px;
      letter-spacing: 2px;
      text-align: center;
    }
    .datetime {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin: 0 0 10px;
      font-size: 9px;
    }
    .status {
      margin: 0 0 12px;
      font-size: 10px;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .code-block {
      margin-bottom: 10px;
    }
    .code-label {
      margin: 10px 0 4px;
      font-size: 9px;
      text-transform: uppercase;
      text-align: center;
      letter-spacing: 0.5px;
    }
    .code-value {
      margin: 0 0 6px;
      font-size: 26px;
      letter-spacing: 6px;
      text-align: center;
      line-height: 1.1;
    }
    .code-meta {
      margin: 0 0 8px;
      font-size: 9px;
      text-align: center;
      line-height: 1.4;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .section-title {
      margin: 14px 0 8px;
      font-size: 9px;
      letter-spacing: 1px;
      text-transform: uppercase;
      text-align: center;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      margin: 0 0 6px;
      font-size: 10px;
      line-height: 1.45;
    }
    .row .label {
      flex-shrink: 0;
      white-space: nowrap;
      padding-right: 4px;
    }
    .row .value {
      text-align: right;
      flex: 1;
      min-width: 0;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .note-text {
      margin: 0 0 8px;
      font-size: 10px;
      line-height: 1.5;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .footer {
      margin: 14px 0 0;
      padding-top: 10px;
      border-top: 1px solid #000;
      font-size: 9px;
      text-align: center;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>

  <p class="store-name">LIBRAIRIE 2B</p>

  <div class="datetime">
    <span>${dateStr}</span>
    <span>${timeStr}</span>
  </div>

  <p class="status">Commande confirmée</p>

  <div class="code-block">${codeBlocks}</div>

  ${blockTitle('Détails')}
  ${line('Nom', data.nom)}
  ${data.telephone ? line('Tél', data.telephone) : ''}

  ${childDetails}
  ${couvertureSection}
  ${avanceSection}
  ${noteSection}

  <p class="footer">Merci pour votre confiance !</p>

</body>
</html>`
}
