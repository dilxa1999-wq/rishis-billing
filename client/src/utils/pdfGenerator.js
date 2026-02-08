import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to load image and convert to Data URL for better compatibility
const getLogoDataUrl = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = reject;
        img.src = url;
    });
};

export const generatePDF = async (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    let logoData = null;
    try {
        logoData = await getLogoDataUrl('/logo.png');
    } catch (e) {
        console.warn("Logo loading failed", e);
    }

    const drawWatermark = (pdf) => {
        if (logoData) {
            try {
                const watermarkSize = 150; // Increased size
                pdf.saveGraphicsState();
                // Check if GState is supported, fallback to simple opacity if needed
                if (typeof pdf.GState === 'function') {
                    pdf.setGState(new pdf.GState({ opacity: 0.05 })); // Higher transparency
                } else {
                    console.warn("GState not supported in this jsPDF version");
                }
                pdf.addImage(logoData, 'PNG', (pageWidth - watermarkSize) / 2, 85, watermarkSize, watermarkSize);
                pdf.restoreGraphicsState();
            } catch (err) {
                console.warn("Watermark drawing failed", err);
            }
        }
    };

    // Draw header on first page
    if (logoData) {
        try {
            doc.addImage(logoData, 'PNG', pageWidth / 2 - 15, 10, 30, 30);
        } catch (err) {
            console.warn("Header logo drawing failed", err);
        }
    } else {
        doc.setFontSize(22);
        doc.setTextColor(255, 0, 128);
        doc.text("Rishi's Cake House", pageWidth / 2, 20, { align: 'center' });
    }

    drawWatermark(doc);

    doc.setFontSize(10);
    doc.setTextColor(100);
    const startTextY = 45;

    doc.text("Ready to bake your dreams into reality. Connect with us directly!", pageWidth / 2, startTextY, { align: 'center' });
    doc.text("448/7, New Kandy Road, Biyagama, Sri Lanka 11650", pageWidth / 2, startTextY + 5, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(10, startTextY + 12, pageWidth - 10, startTextY + 12);

    doc.setFontSize(10);
    doc.setTextColor(0);
    const startY = startTextY + 20;
    doc.text(`Order ID: #${order.id || 'N/A'}`, 14, startY);
    doc.text(`Date: ${new Date(order.created_at || Date.now()).toLocaleString()}`, 14, startY + 6);
    doc.text(`Customer: ${order.customer_name || 'Walk-in Customer'}`, 14, startY + 12);
    if (order.customer_contact) {
        doc.text(`Contact: ${order.customer_contact}`, 14, startY + 18);
    }

    const items = order.items || [];
    const tableColumn = ["Item", "Qty", "Price", "Amount"];
    const tableRows = items.map(item => {
        const price = parseFloat(item.price || item.price_at_sale || 0);
        const qty = parseInt(item.quantity || 0);
        return [
            item.name || 'Unknown Item',
            qty,
            `Rs. ${price.toFixed(2)}`,
            `Rs. ${(price * qty).toFixed(2)}`
        ];
    });

    autoTable(doc, {
        startY: startY + 25,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [255, 0, 128] },
        styles: { fontSize: 10 },
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                drawWatermark(doc);
            }
        }
    });

    // --- Totals with Styled Boxes ---
    const footerHeight = 55; // Increased to prevent overlap and provide safety margin
    let finalY = pageHeight - footerHeight;

    // Check if table overlaps the footer area
    if (doc.lastAutoTable.finalY > finalY - 5) {
        doc.addPage();
        drawWatermark(doc);
        finalY = 30; // Move totals to top of new page if they didn't fit
    }

    const deliveryFee = parseFloat(order.delivery_fee || 0);
    const totalAmount = parseFloat(order.total_amount || 0);
    const subtotal = totalAmount - deliveryFee;
    const boxWidth = 80;
    const boxX = pageWidth - boxWidth - 10;

    // Subtotal Box
    doc.setFillColor(255, 240, 248);
    doc.rect(boxX, finalY, boxWidth, 8, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(190, 0, 90);
    doc.text(`Subtotal:`, boxX + 2, finalY + 6);
    doc.text(`Rs. ${subtotal.toFixed(2)}`, pageWidth - 12, finalY + 6, { align: 'right' });

    let nextY = finalY + 8;

    if (deliveryFee > 0) {
        doc.setFillColor(255, 240, 248);
        doc.rect(boxX, nextY, boxWidth, 8, 'F');
        doc.text(`Delivery Fee:`, boxX + 2, nextY + 6);
        doc.text(`Rs. ${deliveryFee.toFixed(2)}`, pageWidth - 12, nextY + 6, { align: 'right' });
        nextY += 8;
    }

    // Total Box
    doc.setFillColor(255, 0, 128);
    doc.rect(boxX, nextY + 2, boxWidth, 12, 'F');
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`Total:`, boxX + 2, nextY + 10);
    doc.text(`Rs. ${totalAmount.toFixed(2)}`, pageWidth - 12, nextY + 10, { align: 'right' });

    if (order.type === 'delivery') {
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(190, 0, 90);
        doc.text(`(Delivery Order)`, pageWidth - 12, nextY + 19, { align: 'right' });
    }

    // --- Footer ---
    const footerY = pageHeight - 20; // Increased bottom margin
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("WhatsApp / Call: +94 75 312 1239", pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text("Facebook: Rishi's Cake House  |  TikTok: @rishis_cake_house", pageWidth / 2, footerY + 13, { align: 'center' });

    doc.save(`Receipt_Order_${order.id || 'Unknown'}.pdf`);
};
