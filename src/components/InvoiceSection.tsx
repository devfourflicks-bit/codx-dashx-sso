import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Wrench, 
  Truck, 
  HardHat, 
  Shield, 
  Zap, 
  UserPlus,
  Coins
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  module: string; // Will act as Item Name
  technology: string; // Will act as Specs/Details
  description: string; // Will act as Description
  hours: number; // Will act as Qty / Days
  rate: number; // Will act as Unit Price
}

interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

const currencies: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)', locale: 'en-AE' },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal (SAR)', locale: 'en-SA' },
];

export default function InvoiceSection() {
  // Client Info State
  const [clientName, setClientName] = useState('Ananta Infrastructure Private Limited');
  const [clientEmail, setClientEmail] = useState('procurement@anantainfra.in');
  const [clientAddress, setClientAddress] = useState('Sector 5, Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076');
  const [invoiceId, setInvoiceId] = useState('INV-2026-EPC-089');
  const [invoiceDate, setInvoiceDate] = useState('2026-07-18');
  const [dueDate, setDueDate] = useState('2026-07-25');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('INR');

  const selectedCurrency = currencies.find(c => c.code === selectedCurrencyCode) || currencies[0];
  
  // Developer/Contractor Info (Static)
  const devName = 'DevFlick Engineering & Contractors';
  const devEmail = 'contracts@devflicks.io';
  const devGstin = '27AAAAA1111A1Z1';

  // Indian Rupees (₹) Default project value is ₹75,000
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      module: 'Civil Material Supply (Cement & Structural Steel)',
      technology: '100 Bags OPC 53 Grade Cement & Fe-550 TMT Rebars',
      description: 'Delivered premium structural-grade construction aggregate, high-tensile steel reinforcements, and moisture-sealed Portland cement bags for onsite foundation casting.',
      hours: 50,
      rate: 500, // 50 * 500 = 25,000
    },
    {
      id: 'item-2',
      module: 'Mechanical & Electrical Installation Materials',
      technology: 'Finolex Copper armored conduits, Schneider switchgears & cable trays',
      description: 'Supplied high-tension industrial grade copper cabling, protective PVC insulation conduits, distribution DB boards, and safety ground wires.',
      hours: 40,
      rate: 500, // 40 * 500 = 20,000
    },
    {
      id: 'item-3',
      module: 'Heavy Equipment Rentals (Excavator dry lease)',
      technology: '10-Ton Hydraulic Backhoe Loader & Operator (3 Days)',
      description: 'Site excavation, debris clearance, and trench backfilling operations using heavy machinery with certified technical operator support.',
      hours: 3,
      rate: 6000, // 3 * 6000 = 18,000
    },
    {
      id: 'item-4',
      module: 'Personal Protective Equipment (PPE) Safety Kits',
      technology: 'Karam safety harnesses, ISI hard hats, steel-toe boots & hi-vis jackets',
      description: 'Supplied high-visibility retro-reflective vests, lightweight impact-resistant hard hats, high-grade safety shoes, and anchorage harnesses for compliance.',
      hours: 24,
      rate: 500, // 24 * 500 = 12,000
    }
  ]);

  const [copied, setCopied] = useState(false);

  // Totals calculations
  const subtotal = items.reduce((acc, item) => acc + (item.hours * item.rate), 0);
  const gstRate = 0.18; // 18% GST (CGST 9% + SGST 9%)
  
  // The user wanted ₹75,000 total bill amount.
  const [taxInclusive, setTaxInclusive] = useState(true);

  const totalAmount = subtotal;
  const cgst = totalAmount * 0.09;
  const sgst = totalAmount * 0.09;
  const grandTotal = taxInclusive ? totalAmount : (totalAmount + cgst + sgst);

  // Reset items back to default summing up to exactly ₹75,000
  const handleResetDefault = () => {
    setItems([
      {
        id: 'item-1',
        module: 'Civil Material Supply (Cement & Structural Steel)',
        technology: '100 Bags OPC 53 Grade Cement & Fe-550 TMT Rebars',
        description: 'Delivered premium structural-grade construction aggregate, high-tensile steel reinforcements, and moisture-sealed Portland cement bags for onsite foundation casting.',
        hours: 50,
        rate: 500,
      },
      {
        id: 'item-2',
        module: 'Mechanical & Electrical Installation Materials',
        technology: 'Finolex Copper armored conduits, Schneider switchgears & cable trays',
        description: 'Supplied high-tension industrial grade copper cabling, protective PVC insulation conduits, distribution DB boards, and safety ground wires.',
        hours: 40,
        rate: 500,
      },
      {
        id: 'item-3',
        module: 'Heavy Equipment Rentals (Excavator dry lease)',
        technology: '10-Ton Hydraulic Backhoe Loader & Operator (3 Days)',
        description: 'Site excavation, debris clearance, and trench backfilling operations using heavy machinery with certified technical operator support.',
        hours: 3,
        rate: 6000,
      },
      {
        id: 'item-4',
        module: 'Personal Protective Equipment (PPE) Safety Kits',
        technology: 'Karam safety harnesses, ISI hard hats, steel-toe boots & hi-vis jackets',
        description: 'Supplied high-visibility retro-reflective vests, lightweight impact-resistant hard hats, high-grade safety shoes, and anchorage harnesses for compliance.',
        hours: 24,
        rate: 500,
      }
    ]);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      module: 'Additional Material / Equipment Supply',
      technology: 'Onsite ad-hoc procurement items',
      description: 'Procured miscellaneous consumables and safety items required during active site construction.',
      hours: 10,
      rate: 500
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // PDF Generator via jsPDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const colors = {
      primary: [15, 23, 42],      // Dark slate #0f172a
      accent: [79, 70, 229],       // Indigo #4f46e5
      textMain: [30, 41, 59],      // Slate 800
      textLight: [100, 116, 139],  // Slate 500
      border: [226, 232, 240],     // Slate 200
      bgLight: [248, 250, 252],    // Slate 50
    };

    // Draw top dark blue branding band
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, 210, 15, 'F');

    let y = 25;

    // Invoice Title
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('COMMERCIAL CONTRACTING INVOICE', 15, y);

    // Right-aligned Invoice ID
    doc.setFontSize(10);
    doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.text(`INVOICE ID: ${invoiceId}`, 195, y, { align: 'right' });

    y += 8;
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.3);
    doc.line(15, y, 195, y);

    y += 10;

    // Parties Metadata Layout (2 columns)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text('CONTRACTOR / SERVICE PROVIDER:', 15, y);
    doc.text('CLIENT / BILL TO:', 110, y);

    y += 5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.textMain[0], colors.textMain[1], colors.textMain[2]);
    doc.text(devName, 15, y);
    doc.text(clientName, 110, y);

    y += 4.5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    
    doc.text([
      `Email: ${devEmail}`,
      `GSTIN: ${devGstin}`,
      `Currency: ${selectedCurrency.name} (${selectedCurrency.symbol})`
    ], 15, y);

    doc.text([
      `Email: ${clientEmail}`,
      `Address: ${clientAddress}`
    ], 110, y);

    y += 18;
    doc.line(15, y, 195, y);

    y += 8;
    // Date & Payment Summary Blocks
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text('INVOICE DATE', 15, y);
    doc.text('DUE DATE', 65, y);
    doc.text('PAYMENT STATUS', 115, y);
    doc.text('TOTAL DUE NOW', 160, y);

    y += 5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.textMain[0], colors.textMain[1], colors.textMain[2]);
    doc.text(invoiceDate, 15, y);
    doc.text(dueDate, 65, y);
    
    // Highlight Outstanding Payment
    doc.setTextColor(225, 29, 72); // Rose 600 (not received)
    doc.text('Outstanding (Full)', 115, y);

    doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.text(`${selectedCurrency.symbol} ${grandTotal.toLocaleString(selectedCurrency.locale)}/-`, 160, y);

    y += 10;
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.line(15, y, 195, y);

    y += 10;

    // Items Section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('ITEMIZED PROCUREMENT & SERVICE LEDGER', 15, y);

    y += 6;
    // Table Header Band
    doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
    doc.rect(15, y, 180, 8, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(colors.textMain[0], colors.textMain[1], colors.textMain[2]);
    doc.text('Supply Deliverable & Specifications', 18, y + 5.5);
    doc.text('Qty / Days', 135, y + 5.5, { align: 'center' });
    doc.text('Unit Rate', 162, y + 5.5, { align: 'center' });
    doc.text(`Amount (${selectedCurrency.code})`, 190, y + 5.5, { align: 'right' });

    y += 8;

    // Loop items
    items.forEach((item, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.2);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colors.textMain[0], colors.textMain[1], colors.textMain[2]);
      doc.text(`${index + 1}. ${item.module}`, 18, y + 4.5);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.text(`Specs: ${item.technology}`, 18, y + 9);

      // Description text wrapping
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      const splitText = doc.splitTextToSize(item.description, 110);
      doc.text(splitText, 18, y + 13.5);

      // Hours, Rate, Line total
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colors.textMain[0], colors.textMain[1], colors.textMain[2]);
      doc.text(String(item.hours), 135, y + 4.5, { align: 'center' });
      doc.text(`${selectedCurrency.symbol} ${item.rate}`, 162, y + 4.5, { align: 'center' });
      doc.text(`${selectedCurrency.symbol} ${(item.hours * item.rate).toLocaleString(selectedCurrency.locale)}`, 190, y + 4.5, { align: 'right' });

      y += 16 + (splitText.length * 3.5);
      doc.line(15, y, 195, y);
    });

    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    // Totals Block on the Right
    y += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.textMain[0], colors.textMain[1], colors.textMain[2]);
    doc.text('Subtotal:', 135, y);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${selectedCurrency.symbol} ${subtotal.toLocaleString(selectedCurrency.locale)}`, 190, y, { align: 'right' });

    y += 5;
    doc.setFont('Helvetica', 'normal');
    
    if (taxInclusive) {
      doc.text('18% GST (CGST 9% + SGST 9%) - Inclusive:', 100, y);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${selectedCurrency.symbol} ${(subtotal * 0.18).toLocaleString(selectedCurrency.locale)}`, 190, y, { align: 'right' });
    } else {
      doc.text('CGST (9%):', 135, y);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${selectedCurrency.symbol} ${cgst.toLocaleString(selectedCurrency.locale)}`, 190, y, { align: 'right' });
      
      y += 5;
      doc.setFont('Helvetica', 'normal');
      doc.text('SGST (9%):', 135, y);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${selectedCurrency.symbol} ${sgst.toLocaleString(selectedCurrency.locale)}`, 190, y, { align: 'right' });
    }

    y += 6;
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(130, y, 65, 8, 'F');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`Grand Total (${selectedCurrency.code}):`, 134, y + 5.5);
    doc.text(`${selectedCurrency.symbol} ${grandTotal.toLocaleString(selectedCurrency.locale)}/-`, 190, y + 5.5, { align: 'right' });

    y += 16;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Contract Compliance Information
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CONTRACT & SAFETY COMPLIANCE SUMMARY', 15, y);

    y += 5;
    doc.setFillColor(colors.bgLight[0], colors.bgLight[1], colors.bgLight[2]);
    doc.rect(15, y, 180, 18, 'F');
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    
    doc.text('• CIVIL WORKS: Reinforced concrete cement foundations, structural steel distribution, aggregate supplies, dry-land grading.', 18, y + 5);
    doc.text('• ELECTRICAL & MECHANICAL: Heavy armoured cabling conduits, safety circuit breakers, ground wiring grids, heavy machinery leasing.', 18, y + 9);
    doc.text('• HEALTH, SAFETY & ENVIRONMENT: Strict ISO safety compliance protocols, comprehensive safety equipment supply & active risk mitigation.', 18, y + 13);

    y += 24;
    // Terms of service notes
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(colors.textMain[0], colors.textMain[1], colors.textMain[2]);
    doc.text('Commercial Terms & Conditions:', 15, y);

    y += 4.5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text('1. Due Date: Outstanding amount is strictly due within 7 days of invoice generation (Net 7) bank-transfer.', 15, y);
    doc.text('2. Material Ownership: Complete hardware, materials, safety kits, and equipment rental clearances transfer fully upon settlement.', 15, y + 3.5);
    doc.text('3. Compliance Certificate: Materials comply with standard BIS / IS safety and testing certifications for engineering works.', 15, y + 7);

    doc.save(`Invoice_${invoiceId}_${clientName.replace(/\s+/g, '_')}.pdf`);
  };

  // Google Sheets Export Format (.CSV File Download)
  const handleDownloadGoogleSheetCSV = () => {
    // Generate headers and data rows
    const headers = [
      'Item / Deliverable',
      'Material / Equipment Specifications',
      'Quantity / Days',
      `Unit Price (${selectedCurrency.code})`,
      `Line Total (${selectedCurrency.code})`,
      'Payment Status',
      'Invoice Date',
      'Due Date',
      'Invoice ID',
      'Client Name'
    ];

    const rows = items.map((item) => [
      `"${item.module.replace(/"/g, '""')}"`,
      `"${item.technology.replace(/"/g, '""')}"`,
      item.hours,
      item.rate,
      item.hours * item.rate,
      'Outstanding',
      invoiceDate,
      dueDate,
      invoiceId,
      `"${clientName.replace(/"/g, '""')}"`
    ]);

    // Add extra total rows
    const spacerRow = ['', '', '', '', '', '', '', '', '', ''];
    const totalRow = [
      `"Grand Total (${selectedCurrency.code})"`,
      '',
      '',
      '',
      grandTotal,
      '"Outstanding"',
      '',
      '',
      '',
      ''
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      spacerRow.join(','),
      totalRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GoogleSheets_Industrial_${invoiceId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy structured layout for quick pasting into Google Sheets cell grid
  const handleCopyForGoogleSheets = () => {
    // Spreadsheet copy paste allows copy pasting tab-separated rows directly into Excel or Google Sheets
    let text = `Deliverable Item\tSpecifications\tQty / Days\tUnit Price (${selectedCurrency.code})\tTotal (${selectedCurrency.code})\n`;
    items.forEach(item => {
      text += `${item.module}\t${item.technology}\t${item.hours}\t${item.rate}\t${item.hours * item.rate}\n`;
    });
    text += `\nSubtotal\t\t\t\t${subtotal}\n`;
    text += `${taxInclusive ? 'GST (18% - Inclusive)' : 'GST (18% Extra)'}\t\t\t\t${taxInclusive ? subtotal * 0.18 : cgst + sgst}\n`;
    text += `Grand Total (${selectedCurrency.code})\t\t\t\t${grandTotal}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" id="billing-invoice-section">
      {/* Top Banner / Goal Info */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-xs font-semibold mb-2 border border-indigo-500/20">
              <Wrench className="w-3.5 h-3.5 text-indigo-400" />
              <span>{selectedCurrency.code} ({selectedCurrency.symbol}) Engineering Procurement Contract</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Industrial & Contracting Invoicing</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Compile itemized bills and commercial receipts for civil supply materials, mechanical/electrical installations, heavy equipment leasing, and safety PPE gear. Ready for PDF download and instant Google Sheets paste grids.
            </p>
          </div>
          <div className="bg-slate-850 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Coins className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium font-mono">TOTAL RECEIVED</p>
              <p className="text-lg font-extrabold text-white">{selectedCurrency.symbol}0</p>
              <p className="text-[11px] text-rose-400 font-medium font-mono">
                {selectedCurrency.symbol}{grandTotal.toLocaleString(selectedCurrency.locale)} Outstanding
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                <span>1. Billing Metadata</span>
              </h2>
              <button 
                onClick={handleResetDefault}
                className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors font-medium"
                title="Reset deliverables to default"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Default ({selectedCurrency.symbol}75,000)</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Client Company / Entity Name</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Client Email Address</label>
                <input 
                  type="email" 
                  value={clientEmail} 
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Client Physical Billing Address</label>
                <textarea 
                  rows={2}
                  value={clientAddress} 
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium"
                />
              </div>

              {/* Currency & Tax selectors Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Billing Currency</label>
                  <select 
                    value={selectedCurrencyCode}
                    onChange={(e) => setSelectedCurrencyCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-indigo-600 dark:text-indigo-400 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50/20"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code} className="text-slate-800 dark:text-slate-200 font-medium">
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">GST / Tax Configuration</label>
                  <select 
                    value={taxInclusive ? 'inclusive' : 'exclusive'}
                    onChange={(e) => setTaxInclusive(e.target.value === 'inclusive')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    <option value="inclusive">GST 18% (Tax-Inclusive)</option>
                    <option value="exclusive">GST 18% (Tax-Exclusive)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Invoice Reference ID</label>
                  <input 
                    type="text" 
                    value={invoiceId} 
                    onChange={(e) => setInvoiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Invoice Date</label>
                  <input 
                    type="date" 
                    value={invoiceDate} 
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Contract Due Date</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Project Compliance specifications */}
          <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-6 border border-slate-150 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>Project Safety & Compliance Summary</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Materials, tools, and industrial devices delivered comply with national engineering and testing credentials:
            </p>
            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-xs flex items-start gap-2">
                <Truck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-700 dark:text-slate-300">Materials Supply</span>
                  <span className="text-slate-500 dark:text-slate-400">BIS certified OPC-53 cement & Fe-550 TMT Steel.</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-xs flex items-start gap-2">
                <Zap className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-700 dark:text-slate-300">Electrical & Mechanical</span>
                  <span className="text-slate-500 dark:text-slate-400">Conforms to standard ISI-marked circuit conduits.</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-xs flex items-start gap-2">
                <HardHat className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-700 dark:text-slate-300">Safety & PPE Compliance</span>
                  <span className="text-slate-500 dark:text-slate-400">Approved Karam / ISI marked helmets & harnesses.</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-xs flex items-start gap-2">
                <Wrench className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-700 dark:text-slate-300">Heavy Equipment Rent</span>
                  <span className="text-slate-500 dark:text-slate-400">Operational fitness clearance certifications.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Bill Editor & Interactive Ledger */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h2 className="font-bold text-slate-900 dark:text-white">2. Itemized Industrial Ledger</h2>
              </div>
              <button
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material/Item</span>
              </button>
            </div>

            {/* Editable Ledger List */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs space-y-3 relative group"
                >
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pr-6">
                    <div className="md:col-span-6">
                      <label className="block text-slate-400 font-semibold mb-1">Item Deliverable Category {index + 1}</label>
                      <input 
                        type="text" 
                        value={item.module} 
                        onChange={(e) => handleUpdateItem(item.id, 'module', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-200 outline-none font-medium"
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-slate-400 font-semibold mb-1">Material Specs / Unit Brand</label>
                      <input 
                        type="text" 
                        value={item.technology} 
                        onChange={(e) => handleUpdateItem(item.id, 'technology', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-200 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Operational / Technical Description</label>
                    <textarea 
                      rows={1}
                      value={item.description} 
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-200 outline-none resize-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Quantity / Days</label>
                      <input 
                        type="number" 
                        value={item.hours} 
                        onChange={(e) => handleUpdateItem(item.id, 'hours', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-200 outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Unit Rate ({selectedCurrency.symbol})</label>
                      <input 
                        type="number" 
                        value={item.rate} 
                        onChange={(e) => handleUpdateItem(item.id, 'rate', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-200 outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Line Price ({selectedCurrency.code})</label>
                      <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-200 font-extrabold border border-slate-150 dark:border-slate-750 text-center font-mono">
                        {selectedCurrency.symbol}{(item.hours * item.rate).toLocaleString(selectedCurrency.locale)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="p-8 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-250 dark:border-slate-700">
                  No deliverables registered. Click "Add Material/Item" to start itemizing your contractor bill.
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 text-xs space-y-2.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                <span>Base Supply Subtotal:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                  {selectedCurrency.symbol}{subtotal.toLocaleString(selectedCurrency.locale)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                <span>
                  18% Indian GST (9% CGST + 9% SGST):
                  {taxInclusive && <span className="ml-1.5 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">Inclusive</span>}
                </span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                  {selectedCurrency.symbol}{(subtotal * 0.18).toLocaleString(selectedCurrency.locale)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100 dark:border-slate-700/80 font-bold text-slate-900 dark:text-white">
                <span className="text-base text-indigo-600 dark:text-indigo-400 font-bold">Total Contract Invoice Value:</span>
                <span className="text-xl font-black bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 font-mono">
                  {selectedCurrency.symbol}{grandTotal.toLocaleString(selectedCurrency.locale)}
                </span>
              </div>
            </div>

            {/* Downloader Toolbar Action Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-150 dark:border-slate-700">
              {/* PDF Download Button */}
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all active:scale-97 cursor-pointer shadow-sm shadow-rose-650/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Bill</span>
              </button>

              {/* Google Sheet CSV Download */}
              <button
                onClick={handleDownloadGoogleSheetCSV}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all active:scale-97 cursor-pointer shadow-sm shadow-emerald-650/10"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Google Sheet</span>
              </button>

              {/* Google Sheets Layout Clip Copier */}
              <button
                onClick={handleCopyForGoogleSheets}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 font-bold rounded-xl text-xs transition-all active:scale-97 cursor-pointer shadow-sm ${
                  copied 
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-250 dark:border-indigo-800' 
                    : 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Cell Grid!' : 'Copy to Google Sheets'}</span>
              </button>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-normal">
              💡 <span className="font-semibold">Spreadsheet Tip:</span> Click <span className="underline">Copy to Google Sheets</span> and press <kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[9px] border border-slate-200">Ctrl+V</kbd> inside any Google Sheet cell to instantly paste perfectly structured rows and formulas!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
