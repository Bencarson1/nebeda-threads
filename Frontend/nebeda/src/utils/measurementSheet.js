import logoUrl from '../assets/images/logo.png'
import { normalizeMeasurements } from '../data/measurementProfiles'
import formatOrderReference from './orderReference'

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(value)) : 'Not set'
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character])
}

function getSheetData(order) {
  return {
    measurements: normalizeMeasurements(order.measurements, order.gender),
    reference: formatOrderReference(order._id, 'NTC'),
  }
}

function printMeasurementSheet(order) {
  const { measurements, reference } = getSheetData(order)
  const printWindow = window.open('', '_blank')
  if (!printWindow) throw new Error('Allow pop-ups to print the measurement sheet.')
  printWindow.opener = null

  const rows = measurements.fields.map((field) => `<tr><td>${escapeHtml(field.name)}</td><td>${escapeHtml(field.value)} ${escapeHtml(measurements.unit)}</td></tr>`).join('')
  const images = (order.inspirationImages || []).map((image) => `<img src="${escapeHtml(image.url)}" alt="Nebeda Threads custom order inspiration reference" />`).join('')

  printWindow.document.write(`<!doctype html><html><head><title>${reference} Measurements</title><style>
    body{font-family:Arial,sans-serif;color:#17130d;margin:36px;line-height:1.5}header{border-bottom:2px solid #b89450;padding-bottom:18px;margin-bottom:24px}h1{margin:0;font-family:Georgia,serif}small{color:#665f54}.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0}table{border-collapse:collapse;width:100%;margin-top:14px}td{border-bottom:1px solid #ddd;padding:10px 4px}td:last-child{text-align:right;font-weight:700}.notes{margin-top:24px;padding:16px;background:#f7f1e7}.images{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.images img{width:100%;height:180px;object-fit:cover}@media print{button{display:none}}@media(max-width:600px){body{margin:20px}.meta{grid-template-columns:1fr}.images{grid-template-columns:1fr}}
  </style></head><body><header><h1>Nebeda Threads</h1><small>Professional Measurement Sheet</small></header><div class="meta"><div><strong>Customer:</strong> ${escapeHtml(order.fullName)}</div><div><strong>Reference:</strong> ${reference}</div><div><strong>Date:</strong> ${formatDate(order.createdAt)}</div><div><strong>Garment:</strong> ${escapeHtml(order.outfitType)}</div><div><strong>Garment for:</strong> ${escapeHtml(measurements.gender || order.gender)}</div><div><strong>Unit:</strong> ${escapeHtml(measurements.unit)}</div></div><h2>Measurements</h2><table>${rows}</table><div class="notes"><strong>Special instructions</strong><p>${escapeHtml(order.styleNotes || 'None provided.')}</p></div>${images ? `<h2>Reference Images</h2><div class="images">${images}</div>` : ''}<script>window.onload=()=>window.print()</script></body></html>`)
  printWindow.document.close()
}

function getImageFormat(dataUrl) {
  if (dataUrl.startsWith('data:image/png')) return 'PNG'
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP'
  return 'JPEG'
}

async function imageToDataUrl(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function downloadMeasurementPdf(order) {
  const [{ jsPDF }, { measurements, reference }] = await Promise.all([
    import('jspdf'),
    Promise.resolve(getSheetData(order)),
  ])
  const document = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = document.internal.pageSize.getWidth()
  let y = 18

  try {
    const logo = await imageToDataUrl(logoUrl)
    document.addImage(logo, 'PNG', 18, y, 27, 14, undefined, 'FAST')
  } catch {
    document.setFont('helvetica', 'bold')
    document.text('NEBEDA THREADS', 18, y + 8)
  }

  document.setFont('helvetica', 'bold')
  document.setFontSize(18)
  document.text('Professional Measurement Sheet', 52, y + 7)
  document.setDrawColor(184, 148, 80)
  document.line(18, y + 19, pageWidth - 18, y + 19)
  y += 29

  document.setFontSize(10)
  const details = [
    `Customer: ${order.fullName}`,
    `Reference: ${reference}`,
    `Date: ${formatDate(order.createdAt)}`,
    `Garment: ${order.outfitType}`,
    `Garment for: ${measurements.gender || order.gender}`,
    `Unit: ${measurements.unit}`,
  ]
  details.forEach((line) => { document.text(line, 18, y); y += 6 })
  y += 4

  document.setFontSize(13)
  document.text('Measurements', 18, y)
  y += 7
  document.setFontSize(10)
  measurements.fields.forEach((field) => {
    if (y > 272) { document.addPage(); y = 18 }
    document.setDrawColor(225, 225, 225)
    document.line(18, y + 3, pageWidth - 18, y + 3)
    document.text(field.name, 18, y)
    document.text(`${field.value} ${measurements.unit}`, pageWidth - 18, y, { align: 'right' })
    y += 7
  })

  y += 5
  document.setFont('helvetica', 'bold')
  document.text('Special instructions', 18, y)
  y += 6
  document.setFont('helvetica', 'normal')
  const noteLines = document.splitTextToSize(order.styleNotes || 'None provided.', pageWidth - 36)
  document.text(noteLines, 18, y)
  y += noteLines.length * 5 + 7

  for (const [index, image] of (order.inspirationImages || []).entries()) {
    try {
      if (y > 215) { document.addPage(); y = 18 }
      if (index === 0) { document.setFont('helvetica', 'bold'); document.text('Reference Images', 18, y); y += 7 }
      const dataUrl = await imageToDataUrl(image.url)
      document.addImage(dataUrl, getImageFormat(dataUrl), 18, y, 58, 58, undefined, 'FAST')
      y += 64
    } catch {
      // A remote reference image can be omitted if its host blocks browser export.
    }
  }

  document.save(`${reference}-measurements.pdf`)
}

export { downloadMeasurementPdf, printMeasurementSheet }
