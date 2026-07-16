/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define([], function () {

    var isUpdating = false;

    function fieldChanged(context) {

        if (isUpdating) return;

        var rec = context.currentRecord;

        // 🔹 1. Project changed
        if (context.fieldId === 'custcol_ih_project_list') {

            var projectId = rec.getValue({
                fieldId: 'custcol_ih_project_list'
            });

            if (projectId) {

                isUpdating = true;

                // Set Project (Customer / Job)
                rec.setValue({
                    fieldId: 'customer',
                    value: projectId,
                    ignoreFieldChange: false // triggers sourcing
                });

                // Clear standard Project Task
                rec.setValue({
                    fieldId: 'casetaskevent',
                    value: ''
                });

                // Clear custom Project Task
                rec.setValue({
                    fieldId: 'custcol_ih_project_task',
                    value: ''
                });

                isUpdating = false;

                log.debug('Project changed, updated Customer and cleared Tasks');
            }
        }

        // 🔹 2. Project Task changed
        if (context.fieldId === 'custcol_ih_project_task') {

            var taskId = rec.getValue({
                fieldId: 'custcol_ih_project_task'
            });

            if (taskId) {

                var project = rec.getValue({
                    fieldId: 'customer'
                });

                if (!project) {
                    alert('Select Project first');
                    return;
                }

                rec.setValue({
                    fieldId: 'casetaskevent',
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