// This is a placeholder file that will redirect to cdnjs.
// If the PDF.js worker can't be loaded dynamically, this file will be loaded as a fallback.
window.location.href = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${new URLSearchParams(window.location.search).get('version') || '3.6.172'}/pdf.worker.min.js`;