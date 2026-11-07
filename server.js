const http = require('http');
const url = require('url');
const PDFDocument = require('pdfkit');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // 1. Endpoint that generates the actual PDF file
    if (parsedUrl.pathname === '/generate-pdf') {
        const query = parsedUrl.query;
        const name = query.name || 'Valued Client';
        const date = query.date || 'Not Specified';
        const time = query.time || 'Not Specified';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=appointment-document.pdf');

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // PDF Design Layout
        doc.fontSize(20).text('OFFICIAL APPOINTMENT NOTICE', { align: 'center' });
        doc.moveDown();
        doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(14).text('Appointment Details:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Full Name: ${name}`);
        doc.text(`Date: ${date}`);
        doc.text(`Time: ${time}`);
        doc.moveDown(2);

        doc.fontSize(10).text('Please present this document upon arrival.', { italic: true, align: 'center' });
        doc.end();
        return;
    }

    // 2. Serve the Web Page with the Appointment Form
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Appointment Booking</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: auto; background-color: #f4f7f6;">
            <h2 style="text-align: center; color: #333;">Book an Appointment</h2>
            <form style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <label style="font-weight: bold; color: #555;">Name:</label><br>
                <input type="text" id="name" required style="width: 100%; padding: 10px; margin-top: 5px; margin-bottom: 15px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;"><br>
                
                <label style="font-weight: bold; color: #555;">Date:</label><br>
                <input type="date" id="date" required style="width: 100%; padding: 10px; margin-top: 5px; margin-bottom: 15px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;"><br>
                
                <label style="font-weight: bold; color: #555;">Time:</label><br>
                <input type="time" id="time" required style="width: 100%; padding: 10px; margin-top: 5px; margin-bottom: 20px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;"><br>
                
                <button type="button" id="shareBtn" style="background: #25D366; color: white; border: none; padding: 12px; width: 100%; font-size: 16px; cursor: pointer; border-radius: 5px; font-weight: bold;">Send PDF to WhatsApp</button>
            </form>

            <script>
                document.getElementById('shareBtn').addEventListener('click', async () => {
                    const name = document.getElementById('name').value;
                    const date = document.getElementById('date').value;
                    const time = document.getElementById('time').value;

                    if (!name || !date || !time) {
                        alert('Please fill in all fields before sending.');
                        return;
                    }

                    try {
                        // Fetch the PDF dynamically from the Node server
                        const response = await fetch(\`/generate-pdf?name=\${encodeURIComponent(name)}&date=\${encodeURIComponent(date)}&time=\${encodeURIComponent(time)}\`);
                        const blob = await response.blob();

                        // Package blob into a File object for native sharing
                        const file = new File([blob], 'appointment-document.pdf', { type: 'application/pdf' });

                        // Trigger native share menu (fully supported on mobile devices)
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: 'Appointment Document',
                                text: 'Here is your official appointment PDF file.'
                            });
                        } else {
                            // Fallback for browsers/desktops without native file share support
                            const link = document.createElement('a');
                            link.href = window.URL.createObjectURL(blob);
                            link.download = 'appointment-document.pdf';
                            link.click();
                            alert('Direct file sharing is not supported on this browser. The PDF file has been downloaded to your device instead.');
                        }
                    } catch (error) {
                        console.error('Sharing failed:', error);
                    }
                });
            </script>
        </body>
        </html>
    `);
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});