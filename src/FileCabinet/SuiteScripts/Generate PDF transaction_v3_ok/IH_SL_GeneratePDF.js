/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/render', 'N/record', 'N/file', 'N/search', 'N/log'],
(render, record, file, search, log) => {

    function onRequest(context) {

        try {

            const recId = context.request.parameters.recId;
            const recType = context.request.parameters.recType;

            //1654 prod id
            // Root parent folder in File Cabinet
            const parentFolderId = 6381; // Replace with your parent folder ID

            // Load transaction
            const transRecord = record.load({
                type: recType,
                id: recId
            });

            // Get vendor
            const vendorId = transRecord.getValue({
                fieldId: 'entity'
            });

            if (!vendorId) {
                throw Error('Vendor not found on transaction.');
            }

            // Vendor folder name (unique)
            const vendorName = transRecord.getText({
                fieldId: 'entity'
            });

            let vendorFolderId = null;

            // Search existing vendor folder
            const folderSearch = search.create({
                type: 'folder',
                filters: [
                    ['name', 'is', vendorName],
                    'AND',
                    ['parent', 'anyof', parentFolderId]
                ],
                columns: [
                    search.createColumn({ name: 'internalid' })
                ]
            });

            folderSearch.run().each(function(result) {
                vendorFolderId = result.getValue('internalid');
                return false;
            });

            // Create folder if not found
            if (!vendorFolderId) {
                const folderRec = record.create({
                    type: 'folder'
                });

                folderRec.setValue({
                    fieldId: 'name',
                    value: vendorName
                });

                folderRec.setValue({
                    fieldId: 'parent',
                    value: parentFolderId
                });

                vendorFolderId = folderRec.save();
            }

            // Get and sanitize tranid
            let tranId = transRecord.getValue({
                fieldId: 'tranid'
            });

            // Remove invalid filename characters
            tranId = tranId.replace(/[\/\\:*?"<>|]/g, '');

            const transactionNumber = transRecord.getValue({
                fieldId: 'transactionnumber'
            });

            // File naming logic
            let fileName = '';
            //no need for requisition will be using PO
            if ((recType === 'purchaseorder') || (recType === 'requestforquote') || (recType === 'purchasecontract')
            || (recType === 'itemreceipt') || (recType === 'vendorpayment')) {
                fileName = `${tranId}.pdf`;
            } 
            else if (recType === 'vendorbill') {
                fileName = `${tranId}_${transactionNumber}.pdf`;
            } 
            else {
                fileName = `${recType}_${recId}.pdf`;
            }

            // Generate PDF
            const pdfFile = render.transaction({
                entityId: parseInt(recId),
                printMode: render.PrintMode.PDF
            });

            pdfFile.name = fileName;
            pdfFile.folder = vendorFolderId;

            // Search existing file (overwrite logic)
            const fileSearch = search.create({
                type: 'file',
                filters: [
                    ['name', 'is', fileName],
                    'AND',
                    ['folder', 'anyof', vendorFolderId]
                ],
                columns: [
                    search.createColumn({ name: 'internalid' })
                ]
            });

            let existingFileId = null;

            fileSearch.run().each(function(result) {
                existingFileId = result.getValue('internalid');
                return false;
            });

            // Delete old file if exists
            if (existingFileId) {
                file.delete({
                    id: existingFileId
                });
            }

            // Save new PDF
            const newFileId = pdfFile.save();

            // Attach file to transaction
            record.attach({
                record: {
                    type: 'file',
                    id: newFileId
                },
                to: {
                    type: recType,
                    id: recId
                }
            });

            // Return PDF to browser
            context.response.writeFile({
                file: pdfFile,
                isInline: true
            });

        } catch (e) {

            log.error({
                title: 'Error Generating PDF',
                details: e
            });

            context.response.write({
                output: 'An error occurred while generating the PDF: ' + e.message
            });
        }
    }

    return {
        onRequest: onRequest
    };
});