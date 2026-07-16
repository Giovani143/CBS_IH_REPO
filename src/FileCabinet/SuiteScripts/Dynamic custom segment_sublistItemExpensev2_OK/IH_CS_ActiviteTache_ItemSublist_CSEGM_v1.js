/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(
    [
        "N/search",
        "N/url",
        "N/currentRecord",
        "N/log",
        "N/record",
        "N/ui/dialog",
        "N/runtime"
    ],
    function (
        search,
        url,
        currentRecord,
        log,
        record,
        dialog,
        runtime
    ) {

        function pageInit(context) {

            /*
             * Function called by Suitelet popup
             */
            window.setSegmentValue = function (line, value, sublistId) {

                try {
                    var rec = currentRecord.get();

                    rec.selectLine({
                        sublistId: sublistId,
                        line: parseInt(line)
                    });

                    rec.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: "cseg1",
                        value: value,
                        ignoreFieldChange: true
                    });

                    /*
                     * IMPORTANT:
                     * Do NOT commit line here.
                     * Let user commit manually so validateLine() can run.
                     */

                } catch (e) {
                    log.error("setSegmentValue error", e);
                }
            };
        }

        function fieldChanged(context) {

            try {

                if (
                    context.sublistId !== "expense" &&
                    context.sublistId !== "line" &&
                    context.sublistId !== "item"
                ) {
                    return;
                }

                var rec = context.currentRecord;
                var sublistId = context.sublistId;

                var currentLine = rec.getCurrentSublistIndex({
                    sublistId: sublistId
                });

                var accountId = null;

                /*
                 * Expense / Journal Entry
                 */
                if (
                    (sublistId === "expense" || sublistId === "line") &&
                    context.fieldId === "account"
                ) {
                    accountId = rec.getCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: "account"
                    });
                }

                /*
                 * Item sublist
                 */
                if (
                    sublistId === "item" &&
                    context.fieldId === "item"
                ) {
                    var itemId = rec.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item"
                    });

                    if (!itemId) {
                        return;
                    }

                    var itemLookup = search.lookupFields({
                        type: search.Type.ITEM,
                        id: itemId,
                        columns: ["expenseaccount"]
                    });

                    if (
                        !itemLookup.expenseaccount ||
                        itemLookup.expenseaccount.length === 0
                    ) {
                        return;
                    }

                    accountId = itemLookup.expenseaccount[0].value;
                }

                if (!accountId) {
                    return;
                }

                /*
                 * Load account -> parent
                 */
                var accountRec = record.load({
                    type: record.Type.ACCOUNT,
                    id: accountId
                });

                var parentAccountId = accountRec.getValue({
                    fieldId: "parent"
                });

                if (!parentAccountId) {
                    return;
                }

                /*
                 * Get parent cseg1
                 */
                var parentLookup = search.lookupFields({
                    type: search.Type.ACCOUNT,
                    id: parentAccountId,
                    columns: ["cseg1"]
                });

                if (
                    !parentLookup.cseg1 ||
                    parentLookup.cseg1.length === 0
                ) {
                    return;
                }

                var parentSegmentId = parentLookup.cseg1[0].value;

                /*
                 * Popup ALWAYS opens
                 */
                var suiteletUrl = url.resolveScript({
                    scriptId: "customscript_ih_sl_activitetache_csegm",
                    deploymentId: "customdeploy_ih_sl_activitetache_csegm",
                    params: {
                        parent: parentSegmentId,
                        line: currentLine,
                        sublist: sublistId
                    }
                });

                window.open(
                    suiteletUrl,
                    "segmentPopup",
                    "width=400,height=250,resizable=yes"
                );

            } catch (e) {
                log.error("fieldChanged error", e);
            }
        }

        /*
         * Validate line before commit
         */
        function validateLine(context) {

            try {

                var rec = context.currentRecord;
                var sublistId = context.sublistId;

                if (
                    sublistId !== "expense" &&
                    sublistId !== "line" &&
                    sublistId !== "item"
                ) {
                    return true;
                }

                var accountId = null;

                /*
                 * For expense / line
                 */
                if (sublistId !== "item") {
                    accountId = rec.getCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: "account"
                    });
                }

                /*
                 * For item sublist use item's expense account
                 */
                if (sublistId === "item") {

                    var itemId = rec.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "item"
                    });

                    if (itemId) {
                        var itemLookup = search.lookupFields({
                            type: search.Type.ITEM,
                            id: itemId,
                            columns: ["expenseaccount"]
                        });

                        if (
                            itemLookup.expenseaccount &&
                            itemLookup.expenseaccount.length > 0
                        ) {
                            accountId =
                                itemLookup.expenseaccount[0].value;
                        }
                    }
                }

                if (!accountId) {
                    return true;
                }

                /*
                 * Check account type
                 */
                var accountLookup = search.lookupFields({
                    type: search.Type.ACCOUNT,
                    id: accountId,
                    columns: ["type"]
                });

                var accountType =
                    accountLookup.type[0].value;

                /*
                 * Mandatory only for Expense / Other Expense
                 */
                if (
                    accountType === "Expense" ||
                    accountType === "OthExpense"
                ) {

                    var segmentValue =
                        rec.getCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: "cseg1"
                        });

                    if (!segmentValue) {

                        var userLanguage =
                            runtime.getCurrentUser().getPreference({
                                name: "language"
                            });

                        var title =
                            "Mandatory Field Missing";

                        var message =
                            "Field Activité (Code Tâche) is mandatory for Expense and Other Expense accounts.";

                        if (userLanguage === "fr_FR") {
                            title =
                                "Champ obligatoire manquant";

                            message =
                                "Le champ Activité (Code Tâche) est obligatoire pour les comptes de type Dépense et Autre dépense.";
                        }

                        dialog.alert({
                            title: title,
                            message: message
                        });

                        return false;
                    }
                }

                return true;

            } catch (e) {
                log.error("validateLine error", e);
                return true;
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            validateLine: validateLine
        };
    }
);