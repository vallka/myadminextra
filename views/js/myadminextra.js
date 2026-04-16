// ============================================================
// SECTION: Globals
// ============================================================

    var old_window_onload = window.onload;
var tracking_link = '';

// Special UK postcodes — orders from these areas get a badge-warning on the postcode
const SPECIAL_POSTCODES = [
    /^BT/i,   // Northern Ireland
    /^IM/i,   // Isle of Man
    /^GY/i,   // Guernsey
    /^JE/i,   // Jersey
    /^IV/i,   // Inverness
    /^KW/i,   // Kirkwall
    /^PO(3[0-9]|4[01])/i,   // Isle of Wight PO30-PO41
    /^PA(20|21|34|37|38|41|42|60|61|62|63|64|65|66|67|68|69)/i,   // Islay PA20-PA69, Oban PA34, Tobermory PA37-PA38, Campbeltown PA41-PA42, Jura PA60-PA69
    /^PA(75|76|77|78|79|80|81|82|83|84|85|86|87|88|89)/i,   // Outer Hebrides PA75-PA99
    /^TR(21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39)/i,   // Isles of Scilly TR21-TR39
    /^ZE/i,    // Shetland ZE1-ZE3
    /^PH(33|34|42|43|44)/i,   // Fort William etc.
];

window.onload = function(e){ 
    // just in case
    if (old_window_onload)
        old_window_onload();


    if (true || myadminextra_param==1 || myadminextra_param==3) {
        if (document.getElementById('supplier_collection')) {
            document.getElementById('supplier_collection').style.display = 'block'
        }
        if (document.getElementById('supplier_combination_collection')) {
            document.getElementById('supplier_combination_collection').style.display = 'block'
        }
    }

    //console.log("window.onload",e); 
    //alert('myadminextra:'+$('h1').text())
    setup_tracking_info_bo()
    setup_bulk_actions()
    setup_orders_bulk_actions()
    setup_dhl_button()
    setup_add_order_by_barcode()

    setup_product_list()
    setup_transcopy_actions()

    setup_customer();
    setup_order_list();
    setup_productnotes_actions();
    setup_product_actions();
    setup_product_pack_info();
    setup_order_in_stock();
    setup_product_reorder();
}

// ============================================================
// SECTION: Customer
// ============================================================

async function setup_customer() {
    console.log('setup_customer-1');

    if ($('.customer-private-note-card h3').length>0) {
        console.log('fetching certificates 0');
        const email = $('.customer-personal-informations-card a[href*=mailto]').text().trim();
        console.log('fetching certificates 1');
        if (email) {
            try {
                console.log('fetching certificates');
            const resp = await $.ajax({
                method: "get",
                dataType: "json",
                url: 'https://app.gellifique.co.uk/prestashop/customer-cert-json/' + email + '/',
            });
            if (resp && Array.isArray(resp.files) && resp.files.length > 0) {
                console.log('fetching certificates - done', resp.files);
                $('.customer-private-note-card h3').append(' - <a target="_blank" href="https://app.gellifique.co.uk/prestashop/customer-cert/' + email + '/">View Certificates</a>');
            }
            } catch (e) {
                console.log('Error fetching certificates', e);
            }
        }
        //$('.customer-private-note-card h3').append(' - <a target="_blank" href="https://app.gellifique.co.uk/prestashop/customer-cert/'+email+'/">View Certificates</a>');
    }

    if ($('.adminorders #customerEmail').length>0) {
        const email = $('.adminorders #customerEmail a[href*=mailto]').text().trim();
        console.log(email);
        let det_link = $('#viewFullDetails a').attr('href');
        $('#viewFullDetails').prepend('<a target="_blank" href="'+det_link.replace('view?','edit?')+'"><i class="material-icons">edit</i></a>');
        if (email) {
            try {
                console.log('fetching certificates');
            const resp = await $.ajax({
                method: "get",
                dataType: "json",
                url: 'https://app.gellifique.co.uk/prestashop/customer-cert-json/' + email + '/',
            });
            if (resp && Array.isArray(resp.files) && resp.files.length > 0) {
                console.log('fetching certificates - done', resp.files);
                $('#viewFullDetails').append('<br><a target="_blank" href="https://app.gellifique.co.uk/prestashop/customer-cert/' + email + '/">View Certificates</a>');
            }
            } catch (e) {
                console.log('Error fetching certificates', e);
            }
        }
        //$('#viewFullDetails').append('<br><a target="_blank" href="https://app.gellifique.co.uk/prestashop/customer-cert/'+email+'/">View Certificates</a>');

        const id_order = $('body.adminorders form[name=cancel_product]').attr('data-order-id');
        let url = '/modules/custom_reporting/view.php?output_format=json&id=11&param='+id_order;
        console.log(url);
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
                console.log(data)
                if (data && data.length>0) {
                    console.log(data[0]['group']);

                    if (data[0]['group']) {
                        $('#customerCard h3.card-header-title').text(data[0]['group']);
                    }
                    console.log(data[0]['referrer']);
                    if (data[0]['referrer']) {
                        $('.adminorders #customerEmail').append('<p><strong>Referrer:</strong> '+data[0]['referrer']+ '</p>');
                    }
                    console.log(data[0]['instagram']);
                    if (data[0]['instagram']) {
                        let instagram = data[0]['instagram'];
                        if (instagram.startsWith('@')) {
                            instagram = instagram.substr(1);
                            instagram = 'https://www.instagram.com/'+instagram;
                        }
                        else if (instagram.startsWith('http')) {
                        }
                        else {
                            instagram = 'https://www.instagram.com/'+instagram;
                        }
                        $('#viewFullDetails').append('<br><a target="_blank" href="'+instagram+'/">View Instagram</a>');
                    }
                }
            }
        });




    }

}

// ============================================================
// SECTION: Tracking
// ============================================================

function get_tracking_a(txt) {
    nu = txt ? txt.replaceAll(' ','') : '';
    if (nu.match(/^P2G\d+$/i)) {
        let link='https://www.parcel2go.com/tracking/' + nu;
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else if (nu.match(/^[A-Z]{2}\d+GB$/i)) {
        let link='https://www.royalmail.com/track-your-item#/tracking-results/'+nu;
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else if (nu.match(/^1Z\w+$/i)) {
        let link='https://www.ups.com/track?loc=en_GB&tracknum='+nu+'&requester=ST/trackdetails';
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else if (nu.match(/^DPD\d+$/i)) {
        let link='https://www.dpdlocal-online.co.uk/tracking/' + nu;
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else if (nu.match(/^DHL:\d+$/i)) {
        let link='https://www.dhl.co.uk/en/express/tracking.html?AWB=' + nu.substr(4);
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else if (nu.match(/^\d{10}$/)) {
        //let link='https://www.dhl.co.uk/en/express/tracking.html?AWB=' + nu;
        let link='https://mydhl.express.dhl/gb/en/tracking.html#/results?id=' + nu;
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else if (nu.match(/^\d{16}$/)) {
        let link='https://new.myhermes.co.uk/track.html#/parcel/' + nu;
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else if (nu.match(/^\d{10}\&\w+$/)) {
        let nua = nu.replace('&','&postcode=');
        let link='https://apis.track.dpdlocal.co.uk/v1/track?parcel=' + nua;
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else if (nu.match(/^P[KQ]6\w+$/i)) {
        let link='https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number='+nu;
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else if (nu.match(/^[A-Z]{2}\d{9}ES$/i)) {
        let link='https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number='+nu;
        text = '<a href="'+link+'" target="_blank">' + txt + '</a>';
        tracking_link = link;
    }
    else {
        return null;
    }
    return text;
}

function setup_tracking_info_bo() {
    const tracking_id = '.js-update-shipping-btn';

    if ($(tracking_id).length>0) {
        const nu = $(tracking_id).parent().prev().text()
        let text = get_tracking_a(nu);

        if (text) {
            $(tracking_id).parent().prev().html(text);
        }
    }
}

// ============================================================
// SECTION: Orders — bulk actions (DPD CSV, delivery slips, upload)
// ============================================================

function setup_orders_bulk_actions() {
    if ($('#order_grid .dropdown-menu').length>0) {
        $('#order_grid .dropdown-menu').append('<div class="dropdown-divider"></div>')

        $('#order_grid .dropdown-menu').append(
            '<a class="dropdown-item" href="#" onclick="csv_for_dpd()">CSV for DPD</a>'
        );

        $('#order_grid .dropdown-menu').append(
            '<a class="dropdown-item" href="#" onclick="printDeliverySlips()">Print Delivery Slips</a>'
        );

        var uploadButton = document.createElement('button');
        uploadButton.id = 'uploadButton';
        uploadButton.classList.add('btn');
        uploadButton.classList.add('btn-outline-secondary');
        uploadButton.innerHTML = 'Upload CSV file from DPD';

        // Create the new file input element
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.width = '190';
        fileInput.style.padding = '5px';
        fileInput.id = 'fileInput';

        // Get a reference to the existing button element
        var bulkActionsButton = document.querySelector('.js-bulk-actions-btn');

        // Insert the new elements after the existing button
        bulkActionsButton.parentNode.insertBefore(uploadButton, bulkActionsButton.nextSibling);
        bulkActionsButton.parentNode.insertBefore(fileInput, bulkActionsButton.nextSibling);

        document.getElementById('uploadButton').addEventListener('click', function() {
            var fileInput = document.getElementById('fileInput');
            var file = fileInput.files[0];
            var formData = new FormData();
            formData.append('file', file);
            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/modules/myadminextra/upload.php');
            xhr.onload = function() {
              if (xhr.status === 200) {
                console.log(xhr.responseText);
                alert('Uploaded. Please refresh the page to see updates');
              }
              else {
                console.log(xhr);
                alert('Error');
              }
            };
            xhr.send(formData);
        });
    }
}

function printDeliverySlips() {
    console.log('printDeliverySlips')
    var ids = '';
    var prod_count=0;
    $('.js-bulk-action-checkbox').each(function(){
        if ($(this).prop('checked')) {
            console.log($(this).val())
            ids += ($(this).val()+',')
            prod_count++;
        }
    });
    ids = ids.replace(/,$/,'');
    console.log('printDeliverySlips:'+ids);
    //window.open('/modules/myadminextra/printDeliverySlips.php?ids='+ids, '_blank');
    window.open('/admin734r04xdw/index.php?controller=AdminPrintDeliverySlips?ids='+ids, '_blank');

    
    //modules/myadminextra/printDeliverySlips.php
}

function csv_for_dpd() {
    console.log('csv_for_dpd')
    var ids = '';
    var prod_count=0;
    $('.js-bulk-action-checkbox').each(function(){
        if ($(this).prop('checked')) {
            console.log($(this).val())
            ids += ($(this).val()+',')
            prod_count++;
        }
    });
    ids = ids.replace(/,$/,'');
    console.log('csv_for_dpd:'+ids)
    get_dpd(ids)
}

function get_dpd(ids='') {
    let url = 'https://app.gellifique.co.uk/api/v1/dhl/list/o/';
    if (ids) {
        url += ids + '/'
    }
    $.ajax({
      dataType: "json",
      url: url,
      headers: {"Authorization": "Token 6b246cc18769c6ec02dc20009649d5ae5903d454"},
      success: function(data) {
        //console.log(data)

        let titles=[
            "weight",
            "name",
            "company",
            "address_1",
            "address_2",
            "city",
            "postal_code",
            "country_code",
            "phone_number",
            "email_address",
            "reference",
            "service"
        ];

        // Get today's date
        var today = new Date();
        // Get the next Tuesday
        var nextTday=-1;
        for (let i=0;i<7;++i) {
            let dd=new Date(today.getTime()+86400000*i);
            console.log(dd);
            console.log(dd.getDay());
            if (dd.getDay()==2) {
                nextTday = dd;
                break;
            }
            if (dd.getDay()==4) {
                nextTday = dd;
                break;
            }
        }

        // Format the date to dd/mm/yyyy format
        var dd = String(nextTday.getDate()).padStart(2, '0');
        var mm = String(nextTday.getMonth() + 1).padStart(2, '0'); // January is 0!
        var yyyy = nextTday.getFullYear();
        var formattedDate = dd + '/' + mm + '/' + yyyy;

        let csv = '';
        csv += 'Weight,Name,Company,Property,Street,Town,County,PostCode,Country,Telephone,Email,Reference,Service,Shipment Date' + '\n';

        for(let i in data) {
            //console.log(titles[t]+'========='+data[i][titles[t]]);
            let w = Math.max(1,Math.round(data[i]["total_weight"]));
            let service = '2^68';
            if (w>=2) service = '2^31';
            if (w>5) service = '2^31';

            dt = formattedDate;

            csv += '"' + w + '",';
            csv += '"' + data[i]["name_ship_to"] + '",';
            csv += '"' + data[i]["company_ship_to"].substr(0,35)+ '",';
            csv += '"' + data[i]["address_1_ship_to"] + '",';
            csv += '"' + data[i]["address_2_ship_to"] + '",';
            csv += '"' + data[i]["city_ship_to"] + '",';
            csv += '"' + data[i]["address_3_ship_to"] + '",';
            csv += '"' + data[i]["postal_code_ship_to"] + '",';
            csv += '"' + data[i]["country_code_ship_to"] + '",';
            csv += '"' + data[i]["phone_number_ship_to"] + '",';
            csv += '"' + data[i]["email_address_ship_to"] + '",';
            csv += '"' + data[i]["id_order"] + '-' + data[i]["shipment_reference"]+ '",';
            csv += '"' + service + '",';
            csv += '"' + dt + '"';

            csv += '\n';
        }
        //console.log(csv)

        
        downloadFile(csv,'dpd-'+$.datepicker.formatDate( "yymmdd", new Date())+'.csv','text/csv')

    }});

}


// ============================================================
// SECTION: Products — bulk actions (bulk update, DYMO labels, SQL query)
// ============================================================

function setup_bulk_actions() {
    if ($('#product_bulk_menu').length>0) {
        setup_bulk_update();
        setup_dymo();

        $('.dropdown.bulk-catalog .dropdown-menu').append('<div class="dropdown-divider"></div>')

        $('.dropdown.bulk-catalog .dropdown-menu').append(
            '<a class="dropdown-item" href="#" onclick="bulk_update_products()"><i class="material-icons">content_copy</i>Bulk Update</a>'
        );

        $('.dropdown.bulk-catalog .dropdown-menu').append(
            '<a class="dropdown-item" href="#" onclick="dymo_labels_products()"><i class="material-icons">content_copy</i>DYMO Labels CSV</a>'
        );

        $('.dropdown.bulk-catalog .dropdown-menu').append(
            '<a class="dropdown-item" href="#" onclick="get_product_ids()"><i class="material-icons">content_copy</i>Show SQL query</a>'
        );
        $('.dropdown.bulk-catalog .dropdown-menu').append('<div class="dropdown-divider"></div>')
 
 

    }

}

function get_product_ids() {
    var ids = '';
    $('[id*=bulk_action_selected_products]').each(function(){
        if ($(this).prop('checked')) {
            //console.log($(this).val())
            ids += ($(this).val()+',')
        }
    });

    ids = ids.replace(/,$/,'');

    showLastSqlQueryIds(ids);
}

function do_dymo_labels() {

    const url = '/modules/myadminextra/get_products_ean13.php?ids='+$('#dymo-ids').val() + '&n='+$('#bulk-dymo-xcopies').val();
    window.open(url);

}

function dymo_labels_products() {
    var ids = '';
    var prod_count=0;
    $('[id*=bulk_action_selected_products]').each(function(){
        if ($(this).prop('checked')) {
            //console.log($(this).val())
            ids += ($(this).val()+',')
            prod_count++;
        }
    });
    ids = ids.replace(/,$/,'');

    $('#dymo-n-products').text(prod_count);
    $('#dymo-ids').val(ids);
    $('#bulk_dymo').modal('show');
}

function bulk_update_products() {

    $('#bulk_update_modal').modal('show');

}

function do_bulk_update() {
    var ids = '';
    var shop_context = $('#shop-list .active a').attr('href');
    /*
    if (shop_context) {
        shop_re = shop_context.match(/setShopContext=([^&]*)/);
        if (shop_re && shop_re[1]) {
            shop_context = shop_re[1];
        }
        else {
            shop_context = '';
        }
    }
    */
    if (window.location.hostname.indexOf('.eu')>=0 || window.location.hostname.indexOf('eu.')>=0) {
        shop_context = 'eu';
    }
    else {
        shop_context = 'uk';
    }
    $('[id*=bulk_action_selected_products]').each(function(){
        if ($(this).prop('checked')) {
            //console.log($(this).val())
            ids += ($(this).val()+',')
        }
    });

    ids = ids.replace(/,$/,'');

    const w = $('#bulk-what').val();

    if (!ids) {
        alert('Nothing to do!')
        return;
    }

    if (w=='price' || w=='cost-price' || w=='weight' || w=='spec-price' || w=='feature' || w=='category' || w=='new' || w=='note') {
        if (!$('#bulk-replace').val()) {
            alert('Please set REPLACE WITH')
            return;
        }
    }
    else {
        if (!$('#bulk-search').val()) {
            alert('Please set SEARCH')
            return;
        }
    }

    console.log(shop_context+' bulk_update_products:'+ids)

    let url = 'https://app.gellifique.co.uk/api/v1/prestashop/product/update/';
    //let url = 'https://blog.gellifique.co.uk/api/v1/prestashop/product/update/';
    $.ajax({
      method: "post",
      async: false,
      data: {
            "ids": ids,
            "what": $('#bulk-what').val(),
            "search": $('#bulk-search').val(),
            "replace": $('#bulk-replace').val(),
            "shop_context": shop_context,
            "employee_id": myadminextra_param
      },
      dataType: "json",
      url: url,
      headers: {"Authorization": "Token 6b246cc18769c6ec02dc20009649d5ae5903d454"},
      success: function(data) {
        console.log(data)
        alert('Updated: '+data['updated'])

    }});
}

// ============================================================
// SECTION: Utilities
// ============================================================

function showLastSqlQueryIds(ids=null) {
    var sql = $('tbody[last_sql]').attr('last_sql');

    sql = sql.replace(/(^WHERE.+$)/m,'$1 \n\nAND p.`id_product` in (\n'+ids+'\n)')

    $('#catalog_sql_query_modal_content textarea[name="sql"]').val(sql);
    $('#catalog_sql_query_modal').modal('show'); 
} 

function downloadFile(data, fileName, type="text/plain") {
    // Create an invisible A element
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);
  
    // Set the HREF to a Blob representation of the data to be downloaded
    a.href = window.URL.createObjectURL(
      new Blob([data], { type })
    );
  
    // Use download attribute to set set desired file name
    a.setAttribute("download", fileName);
  
    // Trigger the download by simulating click
    a.click();
  
    // Cleanup
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
}

// ============================================================
// SECTION: Carriers — DHL
// ============================================================

function get_dhl(ho=0,id=0) {
    let url = 'https://app.gellifique.co.uk/api/v1/dhl/list/';
    if (ho) {
        url += 'h/'
    }
    else {
        url += 'o/'
    }

    if (id) {
        url += id + '/'
    }
    else {
        if ($('#table-order input:checked[type=checkbox]').length>0) {
            //alert(1)
            let ids = ''
            $('#table-order input:checked[type=checkbox]').each(function(){
                ids += this.value+','
            })
            ids += '0'
            url += ids + '/'
            //alert(url)
        }
    }

    //$.getJSON(url,function(data) {
    $.ajax({
      dataType: "json",
      url: url,
      headers: {"Authorization": "Token 6b246cc18769c6ec02dc20009649d5ae5903d454"},
      success: function(data) {
        //console.log(data)

        let titles=[
            "name_ship_from",
            "company_ship_from",
            "address_1_ship_from",
            "address_2_ship_from",
            "address_3_ship_from",
            "house_number_ship_from",
            "postal_code_ship_from",
            "city_ship_from",
            "country_code_ship_from",
            "email_address_ship_from",
            "phone_country_code_ship_from",
            "phone_number_ship_from",
            "name_ship_to",
            "company_ship_to",
            "address_1_ship_to",
            "address_2_ship_to",
            "address_3_ship_to",
            "house_number_ship_to",
            "postal_code_ship_to",
            "city_ship_to",
            "state_code_ship_to",
            "country_code_ship_to",
            "email_address_ship_to",
            "phone_country_code_ship_to",
            "phone_number_ship_to",
            "account_number_shipper",
            "total_weight",
            "declared_value_currency",
            "declared_value",
            "product_code_3_letter",
            "summary_of_contents",
            "shipment_type",
            "shipment_reference",
            "total_shipment_pieces",
            "invoice_type",
            "length",
            "width",
            "depth",
        ];

        let csv = '';

        for(let i in data) {
            for(let t in titles) {
                //console.log(titles[t]+'========='+data[i][titles[t]]);
                csv += '"' + data[i][titles[t]] + '",';
            }
            csv += '\n';
        }
        //console.log(csv)
        
        downloadFile(csv,'dhl-'+$.datepicker.formatDate( "yymmdd", new Date())+'.csv','text/csv')

    }});

}

function setup_dhl_button() {
    if ($('body.adminorders').length>0 && $('#update_order_status_action_btn').length>0) {
        $('#update_order_status_action_btn').parent().append('&nbsp;<span class="btn btn-default"><select id="select-dhl"><option>DHL</option><option>Download CSV</option>')

        const id_order = $('#order-view-page').attr('data-order-title').match(/(\d+)/)[0];

        $('#select-dhl').change(function(){
            if ($('#select-dhl').val()=='Download CSV') {
                if (confirm("Download CSV?")) {
                    get_dhl(0,id_order)
                }
            }
        })

    }
}


function setup_dymo() {

    const html = 
'<div class="modal fade" id="bulk_dymo" tabindex="-1">'+
    '<div class="modal-dialog ">'+
        '<div class="modal-content">'+
            '<div class="modal-header">'+
                '<h4 class="modal-title">DYMO Labels</h4>'+
                '<button type="button" class="close" data-dismiss="modal">&times;</button>'+                    
            '</div>'+
            '<form method="post" action="">'+
            '<div class="modal-body">'+
            '<label><span id="dymo-n-products"></span> products selected</label> <input type="hidden" id="dymo-ids" value="" /><br />'+
            '<label>Copies of each:</label> <input class="form-control" type="number" min="1" name="xcopies" id="bulk-dymo-xcopies" value="1" />'+
            '</div>'+
            '</form>'+
            '<div class="modal-footer">'+
            '<button type="button" class="btn btn-primary">Get CSV!</button>'+
            '<button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Close</button>'+
            '</div>'+
        '</div>'+
    '</div>'+
'</div>';

    if ($('#bulk_dymo').length==0) {
        $('body').append(html);
        var closable = true;
        $('#bulk_dymo').modal({
            backdrop: (closable ? true : 'static'),
            keyboard: closable,
            closable: closable,
            show: false
        });

        $('#bulk_dymo .btn-primary').click(function(){
            do_dymo_labels();

        });
    }
}

function setup_bulk_update() {

    const html = 
'<div class="modal fade" id="bulk_update_modal" tabindex="-1">'+
    '<div class="modal-dialog ">'+
        '<div class="modal-content">'+
            '<div class="modal-header">'+
                '<h4 class="modal-title">Bulk Update</h4>'+
                '<button type="button" class="close" data-dismiss="modal">&times;</button>'+                    
            '</div>'+
            '<form method="post" action="">'+
            '<div class="modal-body">'+
                '<label>What:</label> <select class="form-control" id="bulk-what">'+
                '<option value="new">New / Back in Stock / Unset: [n|b|u]</option>'+
                '<option value="note">Add Product Note</option>'+
                '<option value="reference">Reference</option>'+
                '<option value="name-1">Name(en)</option>'+
                '<option value="name-2">Name(es)</option>'+
                '<option value="name-*">Name(ALL)</option>'+
                '<option value="summary-1">Summary(en)</option>'+
                '<option value="summary-2">Summary(es)</option>'+
                '<option value="summary-*">Summary(ALL)</option>'+
                '<option value="description-1">Description(en)</option>'+
                '<option value="description-2">Description(es)</option>'+
                '<option value="description-*">Description(ALL)</option>'+
                '<option value="price">Price-ex-VAT (* ok)</option>'+
                '<option value="cost-price">Cost-Price (* ok)</option>'+
                '<option value="weight">Weight</option>'+
                '<option value="spec-price">Discount%Price End-Date [Start-Date]</option>'+
                '<option value="feature">Feature: [+/-] feature_id [value_id]</option>'+
                '<option value="category">Category: [+/-] category_id</option>'+
                '</select>'+
                '<label>Search (RE):</label> <input class="form-control" type="text" name="search" id="bulk-search" value="" />'+
                '<label>Replace with:</label> <textarea class="form-control" name="replace" id="bulk-replace"></textarea>'+
            '</div>'+
            '</form>'+
            '<div class="modal-footer">'+
            '<button type="button" class="btn btn-primary">Update!</button>'+
            '<button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Close</button>'+
            '</div>'+
        '</div>'+
    '</div>'+
'</div>';

    if ($('#bulk_update_modal').length==0) {
        $('body').append(html);

        var closable = true;
        $('#bulk_update_modal').modal({
            backdrop: (closable ? true : 'static'),
            keyboard: closable,
            closable: closable,
            show: false
        });

        $('#bulk-what').change(function () {
            const w = $(this).val();
            console.log(w)
            if (w=='price' || w=='cost-price' || w=='weight' || w=='spec-price' || w=='feature' || w=='category' || w=='new' || w=='note') {
                $('#bulk-search').prop('disabled',true);
            }
            else {
                $('#bulk-search').prop('disabled',false);

            }

        });

        if (localStorage.getItem('product-bulk-what')) 
            document.getElementById('bulk-what').selectedIndex=localStorage.getItem('product-bulk-what');
        if (localStorage.getItem('product-bulk-search'))
            document.getElementById('bulk-search').value=localStorage.getItem('product-bulk-search');
        if (localStorage.getItem('product-bulk-replace'))
            document.getElementById('bulk-replace').value=localStorage.getItem('product-bulk-replace');

        $('#bulk_update_modal .btn-primary').click(function(){
            localStorage.setItem('product-bulk-what', document.getElementById('bulk-what').selectedIndex);
            localStorage.setItem('product-bulk-search', document.getElementById('bulk-search').value);
            localStorage.setItem('product-bulk-replace', document.getElementById('bulk-replace').value);
            do_bulk_update();

        });

        $('#bulk-what').change();
    }
}

function process_barcode(code) {
    console.log(code)
    $('#product-search').val('')
    $('#product-search').val(code)
    $('#product-search').focus()
    e = $.Event('keydown')
    e.which = e.keyCode = 9;
    e.originalEvent = e;
    $('#product-search').trigger(e);

    setTimeout( function() {
        console.log('-click-')
        $('#add-product-to-cart-btn').click()
        $('#product-search').val('')
    }, 1000);

}
// ============================================================
// SECTION: Barcode scanning (order creation)
// ============================================================

var code='';
function setup_add_order_by_barcode() {
    if ($('body.adminorders').length>0 && $('#order-creation-container').length>0) {
        console.log('setup_add_order_by_barcode')
        $('#product').detach('keydown')
        
        $( "body" ).keyup(function( event ) {
            console.log( event.originalEvent.keyCode + ' --- ' + code);
          
            if (event.originalEvent.key=='0' ||
                event.originalEvent.key=='1' ||
                event.originalEvent.key=='2' ||
                event.originalEvent.key=='3' ||
                event.originalEvent.key=='4' ||
                event.originalEvent.key=='5' ||
                event.originalEvent.key=='6' ||
                event.originalEvent.key=='7' ||
                event.originalEvent.key=='8' ||
                event.originalEvent.key=='9') {
                  code += event.originalEvent.key;
            }
          
            else if (event.originalEvent.key=='Enter' && code.length==13) {
              event.preventDefault();  
              process_barcode(code);
              code = '';
            }
            else {
              code = '';
            }
          
          });


    }
}

// ============================================================
// SECTION: Product list enrichment
// ============================================================

async function setup_product_list() {
    if ($('#product_catalog_list table.product').length>0) {
        console.log('****Setup Product List');
        
        let ids = [];
        $('#product_catalog_list table.product tbody tr').each(function () {
            //console.log($(this).attr('data-product-id'));
            ids[ids.length] = $(this).attr('data-product-id');

            $(this).find('.product-edit.dropdown-toggle').before('<a class="btn a_productnotes_modal" href="#"><i class="material-icons">note_add</i></a> ');
        })

        let token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
        let host = 'www.gellifique.co.uk';
    
        if (window.location.hostname.indexOf('.eu')>=0 || window.location.hostname.indexOf('eu.')>=0) {
            token = 'GDMMH7YNA6KYW51J5CZWVCFT62J7R34W';
            host = 'www.gellifique.eu';
        }
        if (window.location.hostname.indexOf('test.')>=0) {
            token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
            host = 'test.gellifique.co.uk';
        }

        let url = 'https://'+host+'/api/products/?ws_key='+token+'&output_format=JSON&display=[id,name]&filter[id]=['+ids.join('|')+']';
        console.log(url);
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
              console.log(data)
              if (data['products']) {
                  for(let i=0;i<data['products'].length;++i) {
                    let prod = data['products'][i];

                    let tr = $('#product_catalog_list table.product tbody tr[data-product-id='+prod['id']+']');
                    let td_name = $(tr).find('td')[3];
                    let td_name_txt = $(td_name).html();
                    let cls = 'es-product-name';
                    if (prod['name'][1]['value'].indexOf('copy of ') > -1) {
                        cls+=' td-error-value';
                    }
                    let id_l = full_language_code = 'en-us' ? 1 : 0;
                    $(td_name).html(td_name_txt + '<div class="'+cls+'">'+prod['name'][id_l]['value']+'</div>');

                  }
              }
      
        }});
        url = 'https://'+host+'/api/stock_availables/?ws_key='+token+'&output_format=JSON&display=[id_product,out_of_stock]&filter[id_product]=['+ids.join('|')+']';
        console.log(url);
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
              console.log(data)
              if (data['stock_availables']) {
                  for(let i=0;i<data['stock_availables'].length;++i) {
                    let prod = data['stock_availables'][i];

                    let tr = $('#product_catalog_list table.product tbody tr[data-product-id='+prod['id_product']+']');
                    let td_qnt = $(tr).find('td.product-sav-quantity')[0];
                    let w = '';
                    if (prod['out_of_stock']==1) w = ' <span class="td-error-value">(!)</span>';
                    else if (prod['out_of_stock']==0) w = ' (!)';
                    
                    if (w) $(td_qnt).append(w);

                  }
              }
      
        }});
        url = 'https://'+host+'/modules/adminextrainfo/productinfo.php?ws_key='+token+'&ids='+ids.join(',');
        console.log(url);
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
                //console.log(data)
                if (data) {
                    for(let i=0;i<data.length;++i) {
                        let prod = data[i];
                        console.log(prod);

                        let tr = $('#product_catalog_list table.product tbody tr[data-product-id='+prod['id_product']+']');

                        if ((true || myadminextra_param==1 || myadminextra_param==3)) {
                            if (prod['supplier_reference']) {
                                let td_ref = $(tr).find('td')[4];
                                let td_ref_txt = $(td_ref).html();
                                if (td_ref_txt.indexOf(prod['supplier_reference'])<0) {
                                    let href=$($(tr).find('td')[3]).find('a').attr('href');
                                    if (href) {
                                        href = href.replace('#tab-step1','#tab-step6');
                                    }
                                    let cls = 'supplier_reference';
                                    $(td_ref).html(td_ref_txt + '<div class="'+cls+'"><a href="'+href+'">'+prod['supplier_reference']+'</a></div>');
                                }
                            }
                        }

                        if (prod['quantity']) {
                            let td_qnt = $(tr).find('td.product-sav-quantity')[0];
                            let w = '';
                            let cls = '';
                            let att_name = prod['att_name'];
                            let quantity = parseInt(prod['quantity']);
                            if (att_name) {
                                w = '<br>'+att_name+':'+quantity;
                                if (w) {
                                    $(td_qnt).append(w);
                                }
                            }
                        }
                        if (prod['proc_quantity']) {
                            let td_qnt = $(tr).find('td.product-sav-quantity')[0];
                            let w = '';
                            let cls = '';
                            let proc_quantity = parseInt(prod['proc_quantity']);
                            if (parseInt(prod['in_sets'])) {
                                proc_quantity -= parseInt(prod['in_sets']);
                                if (proc_quantity) {
                                    proc_quantity = '' + proc_quantity + '+' + prod['in_sets'] + 'set';
                                }
                                else {
                                    proc_quantity = '' + prod['in_sets'] + 'set';
                                }
                            }
                            w = ' ('+proc_quantity+')';
                            if (w) $(td_qnt).append(w);
                        }
                        if (prod['kg']) {
                            let td_qnt = $(tr).find('td.product-sav-quantity')[0];
                            let kg = prod['kg'];
                            let w = '';
                            if (kg && parseFloat(kg)>0) {
                                w += '<br>+'+kg+'kg';
                            }
                            if (w) {
                                $(td_qnt).html($(td_qnt).html().replace('<br>+'+kg+'kg',''));
                                $(td_qnt).append(w);
                            }
                        }
                        if (prod['per_month']) {
                            let td_qnt = $(tr).find('td.product-sav-quantity')[0];
                            let td_after_qnt = $(td_qnt).next();
                            let qnt = parseInt($(td_qnt).find('a').text());
                            let per_month = Math.round(prod['per_month']);
                            let w = '';
                            let cls = '';
                            if (per_month > qnt) cls = 'td-error-value';
                            w = '<div class="'+cls+'">'+per_month+'/mon</div>';
                            if (w) {
                                $(td_after_qnt).append(w);
                            }
                        }
                        if (prod['ean13_count']>0) {
                            console.log(prod['ean13_count']);
                            let td_ean = $(tr).find('td')[1];
                            let td_ean_a = $(td_ean).find('a');
                            td_ean_a.addClass("td-error-value");
                            console.log(td_ean_a);
                        }
                        if (!prod['discountable']) {
                            let td_price_vat = $(tr).find('td')[7];
                            $(td_price_vat).append(" <sup>†</sup>");
                        }

                    }
                }
            }
        });

    }
}

// ============================================================
// SECTION: Order list enrichment
// ============================================================

async function setup_order_list() {
    if ($('#order_grid_table').length>0) {
        //console.log('****Setup Order  List');
        let ids = [];
        let carriers = [];
        $('#order_grid_table tbody tr').each(function () {
            //console.log($(this).find('td[class*="column-orders_bulk"] input').attr('value'));
            ids[ids.length] = $(this).find('td[class*="column-orders_bulk"] input').attr('value');
            $(this).attr('data-order-id',$(this).find('td[class*="column-orders_bulk"] input').attr('value'))
        })

        let token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
        let host = 'www.gellifique.co.uk';
    
        if (window.location.hostname.indexOf('.eu')>=0 || window.location.hostname.indexOf('eu.')>=0) {
            token = 'GDMMH7YNA6KYW51J5CZWVCFT62J7R34W';
            host = 'www.gellifique.eu';
        }
        if (window.location.hostname.indexOf('test.')>=0) {
            token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
            host = 'test.gellifique.co.uk';
        }

        let url = 'https://'+host+'/api/orders/?ws_key='+token+'&output_format=JSON&display=[id,shipping_number,id_address_delivery,id_carrier,id_customer,total_shipping]&filter[id]=['+ids.join('|')+']';
        //console.log(url);

        let ids_ad = [];
        let ids_cust = [];
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
              //console.log(data)
              if (data['orders']) {
                  for(let i=0;i<data['orders'].length;++i) {
                    let order = data['orders'][i];
                    ids_ad[ids_ad.length] = order['id_address_delivery']
                    ids_cust[ids_cust.length] = order['id_customer']
                    let found = false;
                    for(let j=0;j<carriers.length;++j) {
                        if (carriers[j]==order['id_carrier']) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        carriers[carriers.length] = order['id_carrier']
                    }

                    let tr = $('#order_grid_table tbody tr[data-order-id='+order['id']+']');
                    let td = tr.find('td[class*="column-osname"]');

                    let a = get_tracking_a(order['shipping_number']);


                    if (!order['shipping_number']) {

                        let status_text = td.find('button.dropdown-toggle').text();
                        if (status_text.match(/(Ready to ship)|(Shipped)/)) {
                            //https://www.gellifique.co.uk/admin734r04xdw/index.php/sell/orders/?_token=7Ngosj5mdTWzUtZTzLeJO9BZYD_KCN1yUJusFONi7Xo
                            //https://www.gellifique.co.uk/admin734r04xdw/index.php/sell/orders/6371/view?_token=7Ngosj5mdTWzUtZTzLeJO9BZYD_KCN1yUJusFONi7Xo#orderShippingTabContent
                            let link = document.location.href + '#orderShippingTabContent';
                            link = link.replace(/\/orders\/\?/,'/orders/'+order['id']+'/view?');
                            a = '<a href="'+link+'">&lt;add&gt;</a>';
                        }
                    }

                    td.append(a?a:order['shipping_number'])
                    tr.attr('data-customer-id',order['id_customer'])
                    tr.attr('data-address-id',order['id_address_delivery'])
                    tr.attr('data-carrier-id',order['id_carrier'])

                    //td = tr.find('td[class*="column-total_paid_tax_incl"]').append(' £'+parseFloat(order['total_shipping']).toFixed(2));
            
                  }
              }
      
        }});
        //console.log('more')
        //console.log(carriers)
        url = 'https://'+host+'/api/addresses/?ws_key='+token+'&output_format=JSON&display=[id,postcode,firstname,lastname,company,address1,address2,city,phone,phone_mobile]&filter[id]=['+ids_ad.join('|')+']';
        //console.log(url);
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
              //console.log(data)
              if (data['addresses']) {
                  for(let i=0;i<data['addresses'].length;++i) {
                    let addr = data['addresses'][i];

                    //console.log(addr)
                    let tr = $('#order_grid_table tbody tr[data-address-id='+addr['id']+']');
                    let td = tr.find('td[class*="column-country_name"]');
                    const isUK = td.text().match(/United Kingdom/);
                    if (isUK) {
                        td.text('UK')
                    }
                    const isSpecialPostcode = SPECIAL_POSTCODES.some(re => re.test(addr['postcode']));
                    const postcodeHtml = isSpecialPostcode
                        ? '<span class="badge badge-warning rounded" style="font-size:100%">'+addr['postcode']+'</span>'
                        : addr['postcode'];
                    td.append('<br>'+postcodeHtml)
                    if (!isUK) {
                        td.html('<span class="badge badge-info rounded" style="font-size:100%">'+td.html()+'</span>')
                    }
                    td.attr('data-name',addr['firstname']+' '+addr['lastname']);
                    td.attr('data-company',addr['company']);
                    td.attr('data-address',addr['address1']+' '+addr['address2']+' '+addr['city']);
                    td.attr('data-postcode',addr['postcode']);
                    td.attr('data-phone',addr['phone_mobile'] || addr['phone']);
                    td.attr('title',addr['firstname']+' '+addr['lastname'] +'\n' +addr['company']+'\n'+addr['address1']+' '+addr['address2']+'\n'+addr['city']+'\n'+addr['postcode']+'\n'+(addr['phone_mobile'] || addr['phone']));

                    td = tr.find('td[class*="column-customer"]');
                    const a = td.find('a[class*=text-primary]');
                    //const name_written = a.text().trim().replaceAll('  ',' '); // doesnt work!
                    const name_written = a.html().replace(/<[^>]*>/g,"").trim().replaceAll('  ',' '); 
                    const name_to_write = (addr['firstname']+' '+addr['lastname']).trim().replaceAll('  ',' ');
                    if (name_written.toLowerCase() != name_to_write.toLowerCase()) {
                        td.append('<br>'+name_to_write)
                    }

                }
              }
      
        }});

        url = 'https://'+host+'/api/customers/?ws_key='+token+'&output_format=JSON&display=[id,email]&filter[id]=['+ids_cust.join('|')+']';
        //console.log(url);
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
              //console.log(data)
              if (data['customers']) {
                  for(let i=0;i<data['customers'].length;++i) {
                    let cust = data['customers'][i];

                    let tr = $('#order_grid_table tbody tr[data-customer-id='+cust['id']+']');
                    let td = tr.find('td[class*="column-customer"]');
                    td.attr('data-email',cust['email']);
                    td.attr('title',cust['email']);
                }
              }
      
        }});

        url = 'https://'+host+'/api/carriers/?ws_key='+token+'&output_format=JSON&display=[id,name]&filter[id]=['+carriers.join('|')+']';
        //console.log(url);
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
              //console.log(data)
              if (data['carriers']) {
                  for(let i=0;i<data['carriers'].length;++i) {
                    let carr = data['carriers'][i];

                    //console.log(carr)
                    let tr = $('#order_grid_table tbody tr[data-carrier-id='+carr['id']+']');
                    let td = tr.find('td[class*="column-country_name"]');
                    td = tr.find('td[class*="column-payment"]');
                    td.append('<br>'+carr['name'].replace('Delivery ',''));
            
                  }
              }
      
        }});
        url = 'https://'+host+'/api/order_histories/?ws_key='+token+'&output_format=JSON&display=[id_order]&filter[id_order_state]=[9]&filter[id_order]=['+ids.join('|')+']';
        //console.log(url);
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
              //console.log(data)
              if (data['order_histories']) {
                  for(let i=0;i<data['order_histories'].length;++i) {
                    let order = data['order_histories'][i];

                    //console.log(order)
                    let tr = $('#order_grid_table tbody tr[data-order-id='+order['id_order']+']');
                    let td = tr.find('td[class*="column-osname"]');

                    td.prepend('<span class="td-error-value" style="float:right">(!)</span> ')
                  }
              }
        }});

    }

    /*
    const table = document.getElementById('order_grid_table');
    if (table) {
        table.addEventListener('click', function(event) {
        if (event.target.classList.contains('column-reference')) {
            const text = event.target.textContent.trim();
            navigator.clipboard.writeText(text)
            .then(() => console.log('Copying text was successful'))
            .catch(err => console.log('Copying text failed:', err));
            event.stopImmediatePropagation();
            event.preventDefault();
            event.stopPropagation();
        }
        }, { capture: true });
    }
    */
}

// ============================================================
// SECTION: Transcopy (copy product/category data from UK to EU)
// ============================================================

var transcopy_data=null;

function setup_transcopy_actions() {
    if (window.location.hostname.indexOf('.eu')>=0 || window.location.hostname.indexOf('eu.')>=0) {

        if ($('div[aria-labelledby="cms_page_title"] .js-locale-item').length>1) {
            need_button = "cms";        
        }
        else if ($('body.adminproducts .product-header .form_switch_language').length>0) {    
            need_button = "product";
        }
        else if ($('body.admincategories .js-locale-input-group:first .dropdown-menu .js-locale-item').length>0) {    
            need_button = "category";
        }
        else if ($('body.adminmodules input#TEXTBANNER_LINK_1').length>0) {    
            need_button = "textbanner";
        }

        if (need_button) {
            if ($('#header-search-container').length>0) {
                $('#header-search-container').after('<div class="component"><a id="a_copy_from_uk" href="#"><i class="material-icons">library_books</i></a></div>')
            }

            const html = 
            '<div class="modal fade" id="transcopy_products_modal" tabindex="-1">'+
                '<div class="modal-dialog ">'+
                    '<div class="modal-content">'+
                        '<div class="modal-header">'+
                            '<h4 class="modal-title" id="form_transcopy_title">Transcopy Product from UK site</h4>'+
                            '<button type="button" class="close" data-dismiss="modal">&times;</button>'+                    
                        '</div>'+
                        '<form method="post" action="" id="form_transcopy_products">'+
                        '<div class="modal-body">'+
                        '</div>'+
                        '</form>'+
                        '<div class="modal-footer"><span id="form_transcopy_result"></span>'+
                        '<button type="button" class="btn btn-primary">Go!</button>'+
                        '<button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Close</button>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>';
            
            if ($('#transcopy_products_modal').length==0) {
                $('body').append(html);
                var closable = true;
                $('#transcopy_products_modal').modal({
                    backdrop: (closable ? true : 'static'),
                    keyboard: closable,
                    closable: closable,
                    show: false
                });
    
                $('#transcopy_products_modal .btn-primary').click(function(){
                    if (transcopy_data) {

                        if (need_button=="product") {
                            $('#form_step6_reference').val(transcopy_data['reference']);
                            $('#form_step6_ean13').val(transcopy_data['ean13']);
                            $('#form_step4_weight').val(transcopy_data['weight']);

                            for (let i=0; i<transcopy_data['name'].length;++i) {
                                let lang_1 = i+1;
                                $('#form_step1_name_'+lang_1).val(transcopy_data['name'][i]['value']);
                                $('#form_step1_description_short_'+lang_1).val(transcopy_data['description_short'][i]['value']);
                                tinyMCE.get('form_step1_description_short_'+lang_1).setContent($('#form_step1_description_short_'+lang_1).val());
                                $('#form_step1_description_'+lang_1).val(transcopy_data['description'][i]['value']);
                                tinyMCE.get('form_step1_description_'+lang_1).setContent($('#form_step1_description_'+lang_1).val());
                            }
                        }                
                        else if (need_button=="category") {
                            for (let i=0; i<transcopy_data['name'].length;++i) {
                                let lang_1 = i+1;
                                $('#category_name_'+lang_1).val(transcopy_data['name'][i]['value']);
                                $('#category_description_'+lang_1).val(transcopy_data['description'][i]['value']);
                                tinyMCE.get('category_description_'+lang_1).setContent($('#category_description_'+lang_1).val());
                            }
                        }


                        $('#transcopy_products_modal').modal('hide');
                    }
                });

            }
    
            $('#a_copy_from_uk').click(function() {
                transcopy_data=null;

                let token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
                let host = 'www.gellifique.co.uk';

                if (need_button=="product") {
                    //let url = 'https://'+token+'@'+host+'/api/products/?output_format=JSON&display=[id,name]&filter[id]=['+$('#form_id_product').val()+']';
                    let url = 'https://'+host+'/api/products/'+$('#form_id_product').val()+'/?ws_key='+token+'&output_format=JSON&display=[id,name,reference,description_short,description,weight,ean13]';

                    $('#form_transcopy_title').text('Transcopy Product from UK site')
                    $.ajax({
                        method: "get",
                        async: false,
                        dataType: "json",
                        url: url,
                        headers: {"Referrer-Policy": "no-referrer-when-downgrade"},
                        success: function(data) {
                        console.log(data)
                        if (data['products']) {
                            transcopy_data = data['products'][0];
                            console.log(transcopy_data)

                            let txt= transcopy_data['reference']+'<br>'+
                                transcopy_data['ean13']+'<br>'+
                                transcopy_data['weight']+'<br>'+
                                transcopy_data['name'][0]['value']+'<hr>'+
                                transcopy_data['description_short'][0]['value']+'<hr>'+
                                transcopy_data['description'][0]['value']+'<br>';

                            $('#transcopy_products_modal .modal-body').html(txt);
                        }
                    }});
                }
                else if (need_button=="category") {
                    let id_cat = document.location.href.match(/\/categories\/(\d+)\//);
                    if (id_cat && id_cat[1]) {
                        id_cat = id_cat[1];
                    }
                    else {
                        id_cat = 0;
                    }

                    let url = 'https://'+host+'/api/categories/'+id_cat+'/?ws_key='+token+'&output_format=JSON&display=[id,name,description]';
                    
                    $('#form_transcopy_title').text('Transcopy Category from UK site')
                    $.ajax({
                        method: "get",
                        async: false,
                        dataType: "json",
                        url: url,
                        headers: {"Referrer-Policy": "no-referrer-when-downgrade"},
                        success: function(data) {
                        console.log(data)
                        if (data['categories']) {
                            transcopy_data = data['categories'][0];
                            console.log(transcopy_data)

                            let txt= 
                                transcopy_data['name'][0]['value']+'<hr>'+
                                transcopy_data['description'][0]['value']+'<br>';

                            $('#transcopy_products_modal .modal-body').html(txt);
                        }
                    }});
                }
                
                $('#transcopy_products_modal').modal('show');
            });
    
        }
    }
}

// ============================================================
// SECTION: Product notes
// ============================================================

function setup_productnotes_actions() {
    console.log('setup_productnotes_actions')
    let need_button = '';
    if ((true || myadminextra_param==1 || myadminextra_param==3) &&  $('body.adminproducts #form_id_product').length>0) {
        need_button = 'one';        
        console.log('setup_productnotes_actions true')
    }

    if ((true || myadminextra_param==1 || myadminextra_param==3) &&  $('#product_catalog_list table.product').length>0) {
        need_button = 'list';        
        console.log('setup_productnotes_actions true')
    }

    let shop_context = 'uk';
    let domain = 1;


    if (window.location.hostname.indexOf('.eu')>=0 || window.location.hostname.indexOf('eu.')>=0) {
        shop_context = 'eu';
        domain = 2;
    }
    else {
        shop_context = 'uk';
        domain = 1;
    }

    if (need_button) {
        let id_product = $('body.adminproducts #form_id_product').val();
        if (need_button=='one') {
            if ($('#header-search-container').length>0) {
                $('#header-search-container').after('<div class="component"><a class="a_productnotes_modal" href="#"><i class="material-icons">note_add</i></a></div>')
            }
        }

        const html = 
        '<div class="modal fade" id="productnotes_modal" tabindex="-1">'+
            '<div class="modal-dialog ">'+
                '<div class="modal-content">'+
                    '<div class="modal-header">'+
                        '<h4 class="modal-title" id="form_transcopy_title">Product Notes</h4>'+
                        '<button type="button" class="close" data-dismiss="modal">&times;</button>'+                    
                    '</div>'+
                    '<form method="post" action="" id="form_productnotes">'+
                    '<textarea class="form-control" name="product_note" id="productnotes_product_note"></textarea>'+
                    '<input type="hidden" id="productnotes_product_id">' + 
                    '</form>'+
                    '<div class="modal-footer">'+
                    '<button type="button" class="btn btn-primary">Add</button>'+
                    '</div>'+
                    '<div class="modal-body" style="max-height: 50vh; overflow-y: scroll">'+
                    '</div>'+
                    '<div class="modal-footer">'+
                    '<button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Close</button>'+
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>';
        
        if ($('#productnotes_modal').length==0) {
            $('body').append(html);
            var closable = true;
            $('#productnotes_modal').modal({
                backdrop: (closable ? true : 'static'),
                keyboard: closable,
                closable: closable,
                show: false
            });
            let host = 'blog.gellifique.co.uk';

            $('.a_productnotes_modal').click(function(e) {
                e.preventDefault();  

                if (need_button=='list') {
                    //console.log($(e.currentTarget).parents('tr').attr('data-product-id'));
                    id_product = $(e.currentTarget).parents('tr').attr('data-product-id');
                }

                let url = 'https://'+host+'/api/v1/gellifihouse/productnotes/?domain='+domain+'&id_product='+id_product;
                    
                $.ajax({
                    method: "get",
                    async: false,
                    dataType: "json",
                    url: url,
                    //headers: {"Referrer-Policy": "no-referrer-when-downgrade"},
                    headers: {
                        "Authorization": "Token e98f798b7deda3402bdae0d6f42f786dd7082a4c"
                    },
                    success: function(data) {
                        //console.log(data)

                        let txt = '';
                        if (data && data.length>0) {
                            for(let i=0;i<data.length;++i) {
                                txt += '<p>'+data[i].created_at.replace('T',' ').replace(/:[.0-9]*?Z$/,' by '+data[i].created_by)+'<br>'+data[i].note+'</p>';
                            }
                        }

                        $('#productnotes_modal .modal-body').html(txt);
                        $('#productnotes_product_id').val(id_product);
                    },
                    error: function(data) {
                        console.log('ERROR')
                        console.log(data)
                        alert('ERROR')
                    }
                });
                $('#productnotes_modal').modal('show');
            });


            $('#productnotes_modal .btn-primary').click(function(){
                //alert('productnotes')

                let url = 'https://'+host+'/api/v1/gellifihouse/productnotes/';
                $.ajax({
                    method: "post",
                    async: false,
                    data: {
                        "id_product": $('#productnotes_product_id').val(),
                        "note": $('#productnotes_product_note').val(),
                        "created_by": myadminextra_param,
                        "domain": domain

                    },
                    dataType: "json",
                    url: url,
                    headers: {
                        "Authorization": "Token e98f798b7deda3402bdae0d6f42f786dd7082a4c"
                    },
                    success: function(data) {
                        console.log(data)
                        //alert('Note added');
                        //$('#productnotes_modal').modal('hide');
                        if (need_button=='one') {
                            $('.a_productnotes_modal').click();
                        }
                        else {
                            $('#productnotes_modal .modal-body').prepend('<p>'+$('#productnotes_product_note').val()+ '</p>');
                        }
                        $('#productnotes_product_note').val('');

                        //$('#productnotes_modal').modal('show');
            
                    },
                    error: function(data) {
                        console.log('ERROR')
                        console.log(data)
                        alert('ERROR')
                    }
                });
            });
        }
    }
}

// ============================================================
// SECTION: Product reorder
// ============================================================

function setup_product_reorder() {
    console.log('setup_product_reorder')
    if ($('#product_catalog_list table.product').length>0) {
        need_button = true;        
        console.log('setup_product_reorder true')
    }
    let shop_context = 'uk';
    let domain = 1;
    let server = 'blog.gellifique.co.uk';


    if (window.location.hostname.indexOf('.eu')>=0 || window.location.hostname.indexOf('eu.')>=0) {
        shop_context = 'eu';
        domain = 2;
        server = 'blog.gellifique.eu';
    }
    else {
        shop_context = 'uk';
        domain = 1;
        server = 'blog.gellifique.co.uk';
    }

    if (need_button) {
        if ($('input[name=products_filter_position_asc]').length>0) {
            $('input[name=products_filter_position_asc]').after('<input id="a_product_reorder_modal" type="button" class="btn btn-outline-secondary" name="products_rearrange2" value="Rearrange+" >')
        }

        const id_cat = $('input[name=filter_category]').val();
        const html = 
        '<div class="modal fade" id="product_reorder_modal" tabindex="-1">'+
            '<div class="modal-dialog" style="height:100%;width:95%;max-width:95%">'+
                '<div class="modal-content" style="height:100%">'+
                    '<div class="modal-header">'+
                        '<h4 class="modal-title" id="form_transcopy_title">Rearrange+</h4>'+
                        '<button type="button" class="close" data-dismiss="modal">&times;</button>'+                    
                    '</div>'+
                    '<div class="modal-body">'+
                    //'<iframe src="http://localhost:8000/prestashop/colourchart/' +id_cat+ 
                    '<iframe src="https://'+server+'/prestashop/colourchart/' +id_cat+ '/?a=1' +
                    '" style="border:none;width:100%;height:100%" referrerpolicy="unsafe-url"></iframe>' +
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>';
        
        if ($('#product_reorder_modal').length==0) {
            $('body').append(html);
            var closable = true;
            $('#product_reorder_modal').modal({
                backdrop: (closable ? true : 'static'),
                keyboard: closable,
                closable: closable,
                show: false
            });
            let host = 'blog.gellifique.co.uk';

            $('#a_product_reorder_modal').click(function() {
                $('#product_reorder_modal').modal('show');
            });
        }
    }
}

// ============================================================
// SECTION: Product page actions (toolbar buttons)
// ============================================================

function setup_product_actions() {
    const js_tocken = admin_modules_link.match(/_token=(\w*)/)[1];
    console.log('setup_product_actions '+js_tocken);
    if ($('body.adminproducts #form_id_product').length>0) {
        $('.adminproducts .product-header .toolbar').prepend('<a target="_blank" href="https://blog.gellifique.co.uk/stats/stock?id_product='+
            $('body.adminproducts #form_id_product').val() + 
            '" class="toolbar-button"><i class="material-icons")>assessment</i><span class="title">Stock</span></a>');    
        $('.adminproducts .product-header .toolbar').prepend('<a target="_blank" href="/modules/custom_reporting/view.php?id=12&param='+
            $('body.adminproducts #form_id_product').val() + '&_token='+js_tocken +
            '" class="toolbar-button"><i class="material-icons")>assessment</i><span class="title">Orders</span></a>');    
    }
}

// ============================================================
// SECTION: Product pack info & sets
// ============================================================

async function setup_product_pack_info() {
    console.log('setup_product_pack_info')
    if ($('body.adminproducts #form_id_product').length>0) {
        if ($('#form_step1_type_product').val()==1) { // pack

            let token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
            let host = 'www.gellifique.co.uk';
            let ids = [];
            let li_ids = {};
        
            if (window.location.hostname.indexOf('.eu')>=0 || window.location.hostname.indexOf('eu.')>=0) {
                token = 'GDMMH7YNA6KYW51J5CZWVCFT62J7R34W';
                host = 'www.gellifique.eu';
            }
            if (window.location.hostname.indexOf('test.')>=0) {
                token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
                host = 'test.gellifique.co.uk';
            }


            $('#form_step1_inputPackItems-data li').each(function(){
                const id = $(this).attr('data-product').replace(/-.*$/,'');
                ids.push(id);
                li_ids[id] = $(this).attr('data-product');
            });

            console.log(ids);
            console.log(li_ids);

            let url = 'https://'+host+'/modules/adminextrainfo/productinfo.php?ws_key='+token+'&ids='+ids.join(',');
            console.log(url);
            await $.ajax({
                method: "get",
                async: false,
                dataType: "json",
                url: url,
                success: function(data) {
                    console.log(data)
                    if (data) {
                        for(let i=0;i<data.length;++i) {
                            let prod = data[i];
                            const id = prod['id_product'];

                            console.log(prod['id_product'],prod['quantity'])
                            let li = $('#form_step1_inputPackItems-data li[data-product='+li_ids[id]+']');
                            console.log(li)
                            let qnt_txt = li.find('.quantity').text();
                            let h4_txt = li.find('h4').text();
                            let product_url = document.location.href.replace(/\/(\d+)\?/,'/'+id+'?');
                            li.find('h4').html('<a target="_blank" href="'+product_url+'">'+h4_txt+'</a>');
                            let cls = '';
                            if (prod['quantity'] <= 0) cls = 'td-error-value';
                            qnt_txt += '<div style="float:left" class="'+cls+'">(available: '+prod['quantity']+')</div>';
                            li.find('.quantity').html(qnt_txt);
                        }
                    }
                }
            });
        

        }
        else {
            const id_product = $('body.adminproducts #form_id_product').val();
            console.log('not a pack:'+id_product);
            let url = '/modules/custom_reporting/view.php?output_format=json&id=13&param='+id_product;
            console.log(url);
            await $.ajax({
                method: "get",
                async: false,
                dataType: "json",
                url: url,
                success: function(data) {
                    console.log(data);
                    if (data && data.length>0) {
                        $('#quantities').append('<h2>Sets</h2>');
                        for(let i=0;i<data.length;++i) {
                            let prod = data[i];
                            const id = prod['id_product'];
                            const name = prod['name'];
                            const reference = prod['reference'];
                            const quantity = prod['quantity'];
                            let product_url = document.location.href.replace(/\/(\d+)\?/,'/'+id+'?');

                            $('#quantities').append('<p>'+'<a target="_blank" href="'+product_url+'">'+name+' ('+reference+')</a> Quantity: '+quantity+'</p>');

                        }
                    }

                }
            });
        }
    }
}

// ============================================================
// SECTION: Order — in-stock status
// ============================================================

async function setup_order_in_stock() {
    console.log('setup_order_in_stock');
    if ($('body.adminorders form[name=cancel_product]').length>0) {
        const id_order = $('body.adminorders form[name=cancel_product]').attr('data-order-id');
        console.log(id_order)


        if (window.location.href.indexOf('#orderShippingTabContent')>=0) {
            //alert('#orderShippingTabContent')
            document.getElementById('orderShippingTab').click();
            //alert('#orderShippingTabContent1')
            document.getElementsByClassName('js-update-shipping-btn')[0].click();
        }


        let token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
        let host = 'www.gellifique.co.uk';
    
        if (window.location.hostname.indexOf('.eu')>=0 || window.location.hostname.indexOf('eu.')>=0) {
            token = 'GDMMH7YNA6KYW51J5CZWVCFT62J7R34W';
            host = 'www.gellifique.eu';
        }
        if (window.location.hostname.indexOf('test.')>=0) {
            token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
            host = 'test.gellifique.co.uk';
        }

        let url = 'https://'+host+'/api/order_details/?ws_key='+token+'&output_format=JSON&display=[id,product_quantity,product_quantity_in_stock,product_id,product_attribute_id]&filter[id_order]=['+id_order+']';
        await $.ajax({
            method: "get",
            async: false,
            dataType: "json",
            url: url,
            success: function(data) {
              console.log(data)
              let ids = [];
              if (data['order_details']) {
                  for(let i=0;i<data['order_details'].length;++i) {
                    console.log(data['order_details'][i].id,data['order_details'][i].product_quantity,data['order_details'][i].product_quantity_in_stock)
                    let tr = $('#orderProduct_'+data['order_details'][i].id);
                    tr.attr('data-product-id',data['order_details'][i].product_id);
                    ids.push(data['order_details'][i].product_id);
              
                    if (data['order_details'][i].product_quantity!=data['order_details'][i].product_quantity_in_stock) {
                        let td = tr.find('.cellProductQuantity');
    
                        td.append(' <span class="td-error-value">('+data['order_details'][i].product_quantity_in_stock+')</span>')
                    }
                  }
              }
              setup_order_stock_qnt(host,ids);
      
        }});

    }
}

async function setup_order_stock_qnt(host,ids) {
    let url = 'https://'+host+'/modules/adminextrainfo/productinfo.php?ws_key='+token+'&ids='+ids.join(',');
    console.log(url);
    await $.ajax({
        method: "get",
        async: false,
        dataType: "json",
        url: url,
        success: function(data) {
            console.log(data)
            let non_discountable = false;
            if (data) {
                for(let i=0;i<data.length;++i) {
                    let prod = data[i];
                    let tr = $('table#orderProductsTable tbody tr[data-product-id='+prod['id_product']+']');
                    let att_name = prod['att_name'] ? (prod['att_name']+':') : "";
                    if (prod['proc_quantity']) {
                        let td_qnt = $(tr).find('td.cellProductAvailableQuantity')[0];
                        let w = '';
                        let cls = '';
                        let proc_quantity = parseInt(prod['proc_quantity']);
                        if (parseInt(prod['in_sets'])) {
                            proc_quantity -= parseInt(prod['in_sets']);
                            if (proc_quantity) {
                                proc_quantity = '' + proc_quantity + '+' + prod['in_sets'] + 'set';
                            }
                            else {
                                proc_quantity = '' + prod['in_sets'] + 'set';
                            }
                        }
                        w = ' ('+att_name+proc_quantity+')';
                        if (w) $(td_qnt).append(w);
                    }
                    if (prod['has_specific_price'] || !prod['discountable']) {  
                        let td_total = $(tr).find('td.cellProductTotalPrice')[0];
                        $(td_total).append(" <sup>†</sup>");
                        non_discountable = true;
                    }
                }
                if  (non_discountable) {
                    let table = $('table#orderProductsTable');
                    table.after('<p class="mb-0 mt-0 text-right text-muted"><small><sup>†</sup> excluded from common discounts</small></p>');
                } 
            }   
        }
    });
}
