setTimeout(function() {

    /**
     * Style dropdown
     */
    let style = document.getElementsByName('inpt_style')[0];

    if (!style) {
        // if we have no "style" at all, then probably we are not on the time entries page?
        // console.log('No style....');

    } else {

        /**
         * Custom table to DOM, to show stuff
         */
        let table = document.createElement('table');
        let thead = document.createElement('thead');
        let tbody = document.createElement('tbody');

        table.cellPadding = 5;
        table.style = "margin: 20px auto; font-size: 16px; border: 1px solid #000; border-collapse: collapse;";

        table.appendChild(thead);
        table.appendChild(tbody);

        document.getElementById('div__body').prepend(table);

        let headerRow = document.createElement('tr');
        let heading_1 = document.createElement('th');
        let heading_2 = document.createElement('th');

        heading_1.style = "font-weight: 700; padding: 5px;";
        heading_2.style = "font-weight: 700; padding: 5px;";
        headerRow.style = "background: #F0F0F0;";

        heading_1.innerHTML = "Project";
        heading_2.innerHTML = "Hours";

        headerRow.appendChild(heading_1);
        headerRow.appendChild(heading_2);
        thead.appendChild(headerRow);

        if (style.value == 'Report') {

            let sum = getSum();
            let total = sum.total;
            let customers = sum.customers;
            let itemCount = sum.itemCount;


            Object.keys(customers).sort(function(a, b) {
                return customers[b] - customers[a]
            }).map(function(customer, index) {

                let row = document.createElement('tr');
                let row_data_1 = document.createElement('td');
                row_data_1.innerHTML = customer;
                let row_data_2 = document.createElement('td');
                row_data_2.innerHTML = customers[customer];
                row_data_2.style = "text-align: right;"

                row.appendChild(row_data_1);
                row.appendChild(row_data_2);

                if (index % 2) {
                    row.style = "background: #F6F6F6;";
                }

                tbody.appendChild(row);
            })


            /**
             * TOTAL row
             */
            let row = document.createElement('tr');
            let row_data_1 = document.createElement('td');
            row.style = "background: red;";
            row_data_1.style = "text-align: right; font-weight: 700; color: #FFF;"
            row_data_1.colSpan = 2;
            row_data_1.innerHTML = `Total: ${total}`;
            row.appendChild(row_data_1);
            tbody.appendChild(row);


        } else {
            /**
             * Error msg
             */
            let row = document.createElement('tr');
            let row_data_1 = document.createElement('td');

            row.style = "background: #F6F6F6;";
            row_data_1.style = "padding: 20px;";
            row_data_1.colSpan = "2"
            row_data_1.innerHTML = '<h1><center>Select "Report" style above!</center></h1>';

            row.appendChild(row_data_1);

            tbody.appendChild(row);
        }
    }


}, 1000)


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
        customers[cust] = (customers[cust] || 0) + hours;
    }

    // console.table(customers);
    // console.log(`%c${total}`, `padding: 10px; background-color: red; color: white; font-size: 2em;`);

    return {
        total: total,
        customers: customers,
        itemCount: list.length
    }
}