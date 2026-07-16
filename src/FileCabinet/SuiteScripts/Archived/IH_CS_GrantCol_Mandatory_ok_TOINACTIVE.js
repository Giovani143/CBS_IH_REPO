/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/search', 'N/ui/dialog', 'N/log'], (search, dialog, log) => {

    const validateLine = (scriptContext) => {
        const rec = scriptContext.currentRecord;

        if (scriptContext.sublistId === 'line') {

            const accountId = rec.getCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'account'
            });
            log.debug('Account ID', accountId);

            const accountName = rec.getCurrentSublistText({
                sublistId: 'line',
                fieldId: 'account'
            });
            log.debug('Account name', accountName);

            const grantId = rec.getCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'custcolih_grant'
            });
            log.debug('Grant ID', grantId);

            if (accountId) {
                const accountLookup = search.lookupFields({
                    type: search.Type.ACCOUNT,
                    id: accountId,
                    columns: ['type']
                });

                const accountType = accountLookup.type[0].value;

                log.debug('Account Type', accountType);

                if (accountType === 'Expense' || accountType === 'OthExpense') {
                    if (!grantId) {
                        dialog.alert({
                            title: 'Mandatory Field Missing',
                            message: 'A Grant is required when selecting an Expense or Other Expense account. ex.'+' ' + accountName
                        });
                        return false;
                    }
                }
            }
        }

        return true;
    };

    return { validateLine };
});