(function() {

    let summaryTable;
    let summaryTHead;
    let summaryTBody;
    let invoiceVat;
    let invoiceDialog;
    let invoiceConfirm;
    let hourlyPrice = 0;

    const invoiceKey = "netsuite-invoice";
    const storageKey = "netsuite-hourly-price";


    /**
     * Trigger event listener on element
     */
    function trigger(element, event) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, false, true);
        element.dispatchEvent(evt);
    }

    /**
     * When VAT mode is changed in modal dialog
     */
    function onVatChange() {
        invoiceConfirm.value = invoiceVat.value;
    }

    /**
     * Get saved hourly fee from synced storage
     */
    function getHourlyPrice() {
        chrome.storage.sync.get([storageKey], function(result) {
            hourlyPrice = result[storageKey];
        });
    }

    /**
     * Set hourly fee to synced storage
     */
    function setHourlyPrice(hourlyPrice) {
        let obj = {};
        obj[storageKey] = hourlyPrice;
        chrome.storage.sync.set(obj);
    }

    /**
     * When hourly fee input changes
     */
    function onInputChange(event) {
        hourlyPrice = parseFloat(event.target.value) || 0;
        setHourlyPrice(hourlyPrice);
        createSummary();
    };

    /**
     * Process netsuite report to collect projects and calculate hours
     */
    function getSum() {
        let list = document.getElementsByClassName('uir-list-row-tr');
        let total = 0;
        let customers = {};

        for (let row of list) {
            let cust = row.cells[1].innerText
            let time = row.cells[3].innerText

            let parts = time.split(":");
            let minutes = {
                '00': 0,
                '15': 0.25,
                '30': 0.5,
                '45': 0.75
            };

            let hours = parseInt(parts[0]) + minutes[parts[1]];
            total += hours;
            customers[cust] = customers[cust] || {};

            customers[cust].name = cust;
            customers[cust].hours = (customers[cust].hours || 0) + hours;
            customers[cust].billable = (customers[cust].hours * hourlyPrice).toFixed(2);
        }

        return {
            total: total,
            totalBillable: (total * hourlyPrice).toFixed(2),
            customers: customers,
            itemCount: list.length
        }
    }

    /**
     * Save billing data to *not synced* storage and open create invoice form
     */
    function createInvoice(vat) {
        let obj = {};
        obj[invoiceKey] = getSum();
        obj[invoiceKey].vat = vat;
        chrome.storage.local.set(obj);
        window.open("https://www.szamlazz.hu/szamla/?page=szamlaszerkeszto");
    }

    function createInvoiceModal() {
        /**
         * Save-reload last VAT value???
         */
        invoiceDialog.showModal();
    }


    /**
     * Render the summary table
     * @param  {boolean} init If this is the first execution
     * @return {void}
     */
    function createSummary(init) {

        /**
         * Dropdowns
         */
        let type = document.getElementsByName('inpt_Time_TYPE')[0];
        let style = document.getElementsByName('inpt_style')[0];

        if (!style || !type) {
            /**
             * if we have no "style" or "type" at all, then probably we are not on the time entries page?
             */

        } else {

            /**
             * Init mode will run just once
             */
            if (init) {
                /**
                 * Custom table to DOM, to show stuff
                 */
                summaryTable = document.createElement('table');
                summaryTHead = document.createElement('thead');
                summaryTBody = document.createElement('tbody');

                summaryTable.cellPadding = 5;
                summaryTable.style = "margin: 20px auto; font-size: 16px; box-shadow: 0 0 15px rgba(0,0,0,.5); border-collapse: collapse;";

                summaryTable.appendChild(summaryTHead);
                summaryTable.appendChild(summaryTBody);

                let headerRow = document.createElement('tr');
                let headName = document.createElement('th');
                let headHours = document.createElement('th');
                let headBillable = document.createElement('th');

                headName.style = "font-weight: 700; padding: 5px; vertical-align: top;";
                headHours.style = "font-weight: 700; padding: 5px; vertical-align: top; text-align: right;";
                headBillable.style = "font-weight: 700; padding: 5px; vertical-align: top; text-align: right;";
                headerRow.style = "background: #F0F0F0;";

                headName.innerHTML = "Project";
                headHours.innerHTML = "Hours";
                headBillable.innerHTML = `EUR/h<br><input id="netsuite-hourly-price" style="text-align: right; padding: 5px; width: 80px;" type="number" value="${hourlyPrice}">`;

                headerRow.appendChild(headName);
                headerRow.appendChild(headHours);
                headerRow.appendChild(headBillable);
                summaryTHead.appendChild(headerRow);

                document.getElementById('div__body').prepend(summaryTable);
                document.getElementById("netsuite-hourly-price").addEventListener("keyup", onInputChange);
                document.getElementById("netsuite-hourly-price").addEventListener("change", onInputChange);


                /**
                 * Create invoice dialog
                 */
                invoiceDialog = document.createElement('dialog');
                // invoiceDialog.id = "invoiceDialog";
                invoiceDialog.innerHTML = `
                    <form method="dialog" id="invoice-dialog">
                        <div class="wrapper">
                            <h1>
                                <label for="invoice-vat">Please select your VAT mode:</label>
                            </h1>
                            <select name="invoice-vat" id="invoice-vat">
                                <option selected value="27.0">27%</option>
                                <option value="-2.0">AAM</option>
                                <option value="-10.0">TEHK</option>
                            </select>
                        </div>
                        <div class="wrapper">
                            If you click on Create invoice button, a new window will open with szamlazz.hu's Create invoice form
                            and line items will be automatically created, based on this summary table.
                            <br><br>
                            In case you are not logged in currently please login then close the opened window & click on Create invoice button again.
                        </div>
                        <div class="footer">
                            <button class="btn default" value="cancel">Cancel</button>
                            <button class="btn" id="invoice-confirm">Create invoice</button>
                        </div>
                    </form>
                `;
                document.getElementsByTagName("body")[0].appendChild(invoiceDialog);

                invoiceVat = document.getElementById("invoice-vat");
                invoiceVat.addEventListener("change", onVatChange);
                invoiceConfirm = document.getElementById("invoice-confirm")

                /**
                 * To process default selection
                 */
                trigger(invoiceVat, "change");

                invoiceDialog.addEventListener('close', () => {
                    if (invoiceDialog.returnValue && invoiceDialog.returnValue !== "cancel") {
                        createInvoice(invoiceDialog.returnValue)
                    }
                });
            }



            /**
             * Clean up table body, in case we are just refresing...
             */
            summaryTBody.innerHTML = "";

            if (style.value == 'Report' && type.value == 'Actual Time') {

                let sum = getSum();
                let totalHours = sum.total;
                let totalBillable = sum.totalBillable; /*(totalHours * hourlyPrice).toFixed(2);*/
                let customers = sum.customers;
                let itemCount = sum.itemCount;


                Object.keys(customers)
                    .sort()
                    .map(function(customer, index) {

                        let row = document.createElement('tr');
                        let projectName = document.createElement('td');
                        projectName.innerHTML = customer;

                        let projectHours = document.createElement('td');
                        projectHours.innerHTML = customers[customer].hours;
                        projectHours.style = "text-align: right;"

                        let projectBillable = document.createElement('td');
                        projectBillable.innerHTML = customers[customer].billable;
                        projectBillable.style = "text-align: right;";

                        row.appendChild(projectName);
                        row.appendChild(projectHours);
                        row.appendChild(projectBillable);

                        if (index % 2) {
                            row.style = "background: #F6F6F6;";
                        }

                        summaryTBody.appendChild(row);
                    })


                /**
                 * TOTAL row
                 */
                let row = document.createElement('tr');
                row.style = "background: red;";

                let sumHours = document.createElement('td');
                sumHours.style = "text-align: right; font-weight: 700; color: #FFF;"
                sumHours.colSpan = 2;
                sumHours.innerHTML = `Total:&nbsp;&nbsp;&nbsp;&nbsp; ${totalHours} h`;

                let sumBillable = document.createElement('td');
                sumBillable.style = "text-align: right; font-weight: 700; color: #FFF;"
                sumBillable.innerHTML = `${totalBillable} €`;

                row.appendChild(sumHours);
                row.appendChild(sumBillable);
                summaryTBody.appendChild(row);

                /**
                 * TOTAL row
                 */
                let btnRow = document.createElement('tr');
                btnRow.style="text-align: right;";

                let btnCell = document.createElement('td');
                btnCell.colSpan="3";

                let btnInvoice = document.createElement('button');
                btnInvoice.type="button";
                btnInvoice.className="btn";
                btnInvoice.innerHTML="Create invoice on szamlazz.hu";
                btnInvoice.addEventListener("click", createInvoiceModal);

                btnCell.appendChild(btnInvoice);
                btnRow.appendChild(btnCell);
                summaryTBody.appendChild(btnRow);



            } else {
                /**
                 * Error msg
                 */
                let row = document.createElement('tr');
                row.style = "background: #F6F6F6;";

                let row_data_1 = document.createElement('td');
                row_data_1.style = "padding: 20px;";
                row_data_1.colSpan = "3"
                row_data_1.innerHTML = '<h1><center>Select "Report" in "Style" dropdown and "Actual Time" in "Type" dropdown!</center></h1>';
                row.appendChild(row_data_1);

                summaryTBody.appendChild(row);
            }
        }
    }


    /**
     * Init sequence
     */
    getHourlyPrice();
    setTimeout(function() {
        createSummary(true)
    }, 1000)


})()