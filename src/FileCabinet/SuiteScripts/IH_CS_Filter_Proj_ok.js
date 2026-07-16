/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define([], function() {

    var isUpdating = false;

    function fieldChanged(context) {

        if (isUpdating) return;

        // ✅ Apply to BOTH sublists
        if (context.sublistId !== 'expense' && context.sublistId !== 'item') return;

        var rec = context.currentRecord;
        var sublistId = context.sublistId;

        // 🔹 1. Project
        if (context.fieldId === 'custcol_ih_project_list') {

            var projectId = rec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custcol_ih_project_list'
            });

            if (projectId) {

                isUpdating = true;

                // Set Project (Customer)
                rec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'customer',
                    value: projectId,
                    ignoreFieldChange: false // 🔥 triggers sourcing
                });

                // Clear Project Task (standard)
                rec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'projecttask',
                    value: ''
                });

                // Clear Custom Task
                rec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_ih_project_task',
                    value: ''
                });

                isUpdating = false;
                log.debug('Project changed, updated Customer and cleared Tasks');
            }
        }

        // 🔹 2. Project Task
        if (context.fieldId === 'custcol_ih_project_task') {

            var taskId = rec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custcol_ih_project_task'
            });

            if (taskId) {

                var project = rec.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'customer'
                });

                if (!project) {
                    alert('Select Project first');
                    return;
                }

                rec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'projecttask',
                    value: taskId,
                    ignoreFieldChange: true
                });
                log.debug('Project Task changed, updated Project Task');
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };

});