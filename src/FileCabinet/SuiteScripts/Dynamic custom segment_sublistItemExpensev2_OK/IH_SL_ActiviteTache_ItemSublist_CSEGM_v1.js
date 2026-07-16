/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(
    ['N/ui/serverWidget', 'N/search', 'N/runtime'],
    function(ui, search, runtime) {

        function onRequest(context) {

            var req = context.request;
            var res = context.response;

            var parentId = req.parameters.parent;
            var line = req.parameters.line;
            var sublistId = req.parameters.sublist;

            /*
             * Detect user language
             */
            var userLanguage = runtime.getCurrentUser().getPreference({
                name: 'language'
            });

            /*
             * Default EN labels
             */
            var title = 'Select Task Code';
            var buttonLabel = 'Select';
            var emptyOption = '-- Select --';
            var alertMessage = 'Please select a task code';

            /*
             * FR labels
             */
            if (userLanguage === 'fr_FR') {
                title = 'Choisir Code Tâche';
                buttonLabel = 'Sélectionner';
                emptyOption = '-- Sélectionner --';
                alertMessage = 'Veuillez sélectionner un code tâche';
            }

            var html =
                '<html>' +
                '<head>' +
                '<style>' +
                'body{font-family:Arial;padding:20px;}' +
                'select{width:100%;height:35px;font-size:14px;}' +
                'button{margin-top:20px;padding:10px 20px;}' +
                '</style>' +
                '</head>' +
                '<body>';

            /*
             * Dynamic title
             */
            html += '<h3>' + title + '</h3>';

            html += '<select id="segmentSelect">';

            /*
             * Empty option
             */
            html += '<option value="">' + emptyOption + '</option>';

            /*
             * SEARCH FILTERED SEGMENTS
             */
            var segSearch = search.create({
                type: 'customrecord_cseg1',
                filters: [
                    ['parent', 'anyof', parentId]
                ],
                columns: [
                    'internalid',
                    'name'
                ]
            });

            segSearch.run().each(function(r) {

                var id = r.getValue('internalid');
                var name = r.getValue('name');

                html +=
                    '<option value="' + id + '">' +
                    name +
                    '</option>';

                return true;
            });

            html += '</select>';

            /*
             * Dynamic button label
             */
            html +=
                '<button onclick="selectSegment()">' +
                buttonLabel +
                '</button>';

            /*
             * Client-side validation + callback
             */
            html +=
                '<script>' +
                'function selectSegment(){' +
                'var sel=document.getElementById("segmentSelect");' +
                'var val=sel.value;' +

                'if(!val){' +
                'alert("' + alertMessage + '");' +
                'return;' +
                '}' +

                'window.opener.setSegmentValue("' +
                line +
                '",val,"' +
                sublistId +
                '");' +

                'window.close();' +
                '}' +
                '</script>';

            html += '</body></html>';

            res.write(html);
        }

        return {
            onRequest: onRequest
        };
    }
);