(function() {

    const invoiceKey = "netsuite-invoice";


    function trigger(element, event) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, false, true);
        element.dispatchEvent(evt);
    }


    function processStorage() {
        chrome.storage.local.get([invoiceKey], function(result) {
            if (result[invoiceKey]) {

                let customers = result[invoiceKey].customers;


                let deviza = document.getElementById("deviza");
                deviza.value = "EUR";
                trigger(deviza, "change");


                document.getElementById("partnername").value = "Sofigate CEE Zrt.";
                document.getElementById("partnertaxnumber").value = "27880159-2-43";
                document.getElementById("partnerirsz").value = "1117";
                document.getElementById("partnercity").value = "Budapest";
                document.getElementById("partneraddr2").value = "Október huszonharmadika utca 8-10.";
                document.getElementById("szfejemail").value = "SofigateCEE@mail.paletteoy.readsoftonline.com";


                Object.keys(customers)
                    .sort()
                    .map(function(customer, index) {

                        var szIndex = index + 1;

                        document.getElementsByName("item_" + szIndex)[0].value = customer;
                        document.getElementsByName("menny_" + szIndex)[0].value = '1';
                        document.getElementsByName("meegys_" + szIndex)[0].value = 'pc';

                        let billable = document.getElementsByName("nettegysar_" + szIndex)[0]
                        billable.value = customers[customer].billable;
                        trigger(billable, "blur");


                        // let vatDropdown = document.getElementsByName("afak_" + szIndex)[0];
                        // vatDropdown.value = "27.0";
                        // trigger(vatDropdown, "change");

                        /**
                         * Add new line, if we are not on the last item already (1st item is present by default)
                         */
                        if (index < Object.keys(customers).length - 1) {
                            var summaryRow = document.getElementById("inv-summary");
                            summaryRow.children[0].click()
                        }

                    });
            }
        });


        // chrome.storage.local.remove([invoiceKey]);
    }


    /**
     * Let some time for szamlazz.hu to load it's own stuff...
     */
    setTimeout(function() {
        processStorage()
    }, 500)


})()