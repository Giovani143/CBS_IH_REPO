/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/url', 'N/log'], (url, log) => {

    function beforeLoad(context) {

        try {

            if (context.type !== context.UserEventType.VIEW) return;

            const rec = context.newRecord;

            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_ih_sl_generatepdf',
                deploymentId: 'customdeploy_ih_sl_generatepdf',
                params: {
                    recId: rec.id,
                    recType: rec.type
                }
            });

            context.form.addButton({
                id: 'custpage_print_save',
                label: 'Print & Save PDF',
                functionName: `window.open('${suiteletUrl}')`
            });

        } catch (e) {

            log.error({
                title: 'Error in beforeLoad',
                details: e
            });
        }
    }

    return { beforeLoad };
});