(function() {

    let summaryTable;
    let summaryTHead;
    let summaryTBody;
    let hourlyPrice = 0;
    const invoiceKey = "netsuite-invoice";
    const storageKey = "netsuite-hourly-price";

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

    function createInvoice() {
        let obj = {};
        obj[invoiceKey] = getSum();
        chrome.storage.local.set(obj);
        window.open("https://www.szamlazz.hu/szamla/?page=szamlaszerkeszto");
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
             * Custom table to DOM, to show stuff
             */
            if (init) {
                summaryTable = document.createElement('table');
                summaryTHead = document.createElement('thead');
                summaryTBody = document.createElement('tbody');

                summaryTable.cellPadding = 5;
                summaryTable.style = "margin: 20px auto; font-size: 16px; border: 1px solid #000; border-collapse: collapse;";

                summaryTable.appendChild(summaryTHead);
                summaryTable.appendChild(summaryTBody);

                document.getElementById('div__body').prepend(summaryTable);

                let headerRow = document.createElement('tr');
                let heading_1 = document.createElement('th');
                let heading_2 = document.createElement('th');
                let heading_3 = document.createElement('th');

                heading_1.style = "font-weight: 700; padding: 5px; vertical-align: top;";
                heading_2.style = "font-weight: 700; padding: 5px; vertical-align: top; text-align: right;";
                heading_3.style = "font-weight: 700; padding: 5px; vertical-align: top; text-align: right;";
                headerRow.style = "background: #F0F0F0;";

                heading_1.innerHTML = "Project";
                heading_2.innerHTML = "Hours";
                heading_3.innerHTML = `EUR/h<br><input id="netsuite-hourly-price" style="text-align: right; padding: 5px; width: 80px;" type="number" value="${hourlyPrice}">`;

                headerRow.appendChild(heading_1);
                headerRow.appendChild(heading_2);
                headerRow.appendChild(heading_3);
                summaryTHead.appendChild(headerRow);

                document.getElementById("netsuite-hourly-price").addEventListener("keyup", onInputChange);
                document.getElementById("netsuite-hourly-price").addEventListener("change", onInputChange);
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
                sumBillable.style = "text-align: right; font-weight: 700; color: #FFF; cursor: pointer;"
                sumBillable.innerHTML = `${totalBillable} €`;
                sumBillable.addEventListener("click", createInvoice);


                row.appendChild(sumHours);
                row.appendChild(sumBillable);

                summaryTBody.appendChild(row);


            } else {
                /**
                 * Error msg
                 */
                let row = document.createElement('tr');
                row.style = "background: #F6F6F6;";

                let row_data_1 = document.createElement('td');
                row_data_1.style = "padding: 20px;";
                row_data_1.colSpan = "2"
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