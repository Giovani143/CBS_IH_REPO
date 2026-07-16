/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log'], (log) => {

    const beforeLoad = (context) => {

        if (
            context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT
        ) {
            return;
        }

        const form = context.form;

        // Add all sublists where the segment may appear
        const sublists = ['item', 'expense', 'line'];

        sublists.forEach((sublistId) => {
            try {
                const sublist = form.getSublist({
                    id: sublistId
                });

                if (!sublist) {
                    return;
                }

                const segmentField = sublist.getField({
                    id: 'cseg1' // Replace with actual custom segment ID
                });

                if (segmentField) {
                    segmentField.isMandatory = true;

                    log.debug({
                        title: 'Segment Set Mandatory',
                        details: `Field cseg1 set mandatory on sublist ${sublistId}`
                    });
                }

            } catch (e) {
                log.debug({
                    title: `Sublist ${sublistId} not available`,
                    details: e.message
                });
            }
        });
    };

    return {
        beforeLoad
    };
});