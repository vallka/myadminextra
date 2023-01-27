var old_window_onload = window.onload;

window.onload = function(e){ 
    // just in case
    if (old_window_onload)
        old_window_onload();

    //console.log("window.onload",e); 
    //alert('myadminextra:'+$('h1').text())
    setup_tracking_info_bo()
    setup_bulk_actions()
    setup_hermes_actions()
    setup_dhl_actions()
    setup_ups_button()
    setup_add_order_by_barcode()
}

function setup_tracking_info_bo() {
    const tracking_id = '#shipping_table .shipping_number_show';

    if ($(tracking_id).length>0) {
        const nu = $(tracking_id).text()
        let text = nu;

        if (nu.match(/^P2G\d+$/i)) {
            let link='https://www.parcel2go.com/tracking/' + nu;
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
        }
        else if (nu.match(/^1Z\w+$/i)) {
            let link='https://www.ups.com/track?loc=en_GB&tracknum='+nu+'&requester=ST/trackdetails';
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
        }
        else if (nu.match(/^DPD\d+$/i)) {
            let link='https://www.dpdlocal-online.co.uk/tracking/' + nu;
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
        }
        else if (nu.match(/^DHL:\d+$/i)) {
            let link='https://www.dhl.co.uk/en/express/tracking.html?AWB=' + nu.substr(4);
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
        }
        else if (nu.match(/^\d{10}$/)) {
            let link='https://www.dhl.co.uk/en/express/tracking.html?AWB=' + nu;
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
        }
        else if (nu.match(/^\d{16}$/)) {
            let link='https://new.myhermes.co.uk/track.html#/parcel/' + nu;
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
        }
        else {
            return;
        }

        $(tracking_id).html(text);
    }
}


function setup_bulk_actions() {
    if ($('#product_bulk_menu').length>0) {
        setup_bulk_update();

        $('.dropdown.bulk-catalog .dropdown-menu').append('<div class="dropdown-divider"></div>')

        $('.dropdown.bulk-catalog .dropdown-menu').append(
            '<a class="dropdown-item" href="#" onclick="bulk_update_products()"><i class="material-icons">content_copy</i>Bulk Update</a>'
        );

        $('.dropdown.bulk-catalog .dropdown-menu').append(
            '<a class="dropdown-item" href="#" onclick="get_product_ids()"><i class="material-icons">content_copy</i>Show SQL query</a>'
        );
        $('.dropdown.bulk-catalog .dropdown-menu').append('<div class="dropdown-divider"></div>')
 
 

        $('.dropdown.bulk-catalog .dropdown-menu').append(
            '<a class="dropdown-item" href="#" onclick="get_hermes()"><i class="material-icons">content_copy</i>Show JSON</a>'
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

function bulk_update_products() {

    $('#bulk_update_modal').modal('show');

}

function do_bulk_update() {
    var ids = '';
    $('[id*=bulk_action_selected_products]').each(function(){
        if ($(this).prop('checked')) {
            //console.log($(this).val())
            ids += ($(this).val()+',')
        }
    });

    ids = ids.replace(/,$/,'');
    
    if (!ids || !$('#bulk-search').val()) {
        alert('Nothing to do!')
        return;
    }

    console.log('bulk_update_products:'+ids)

    //let url = '/pyadmin734r04xdw/api/v1/prestashop/product/update/';
    let url = 'https://blog.gellifique.co.uk/api/v1/prestashop/product/update/';
    $.ajax({
      method: "post",
      async: false,
      data: {
            "ids": ids,
            "what": $('#bulk-what').val(),
            "search": $('#bulk-search').val(),
            "replace": $('#bulk-replace').val(),
      },
      dataType: "json",
      url: url,
      headers: {"Authorization": "Token 6b246cc18769c6ec02dc20009649d5ae5903d454"},
      success: function(data) {
        console.log(data)
        alert('Updated: '+data['updated'])

    }});
}

var qqq;

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

function downloadPDFFromFile(href, fileName, type="application/pdf") {
    // Create an invisible A element
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);
  
    a.href = href;
  
    // Use download attribute to set set desired file name
    a.setAttribute("download", fileName);
  
    // Trigger the download by simulating click
    a.click();
  
    // Cleanup
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
}


function get_hermes() {
    const url = 'https://www.gellifique.co.uk/apipy/hermes/';

    $.getJSON(url,function(data) {
        //console.log(data)
        let titles=[
            "Address_line_1",
            "Address_line_2",
            "Address_line_3",
            "Address_line_4",
            "Postcode",
            "First_name",
            "Last_name",
            "Email",
            "Weight",
            "Compensation",
            "Signature",
            "Reference",
            "Contents",
            "Parcel_value",
            "Delivery_phone",
            "Delivery_safe_place",
            "Delivery_instructions",
            "Service"
        ];


        let csv = titles.join(',');
        //console.log(csv)

        csv += ',\n';

        for(let i in data) {
            for(let t in titles) {
                //console.log(titles[t]+'========='+data[i][titles[t]]);
                csv += '"' + data[i][titles[t]] + '",';
            }
            csv += '\n';
        }
        //console.log(csv)
        
        downloadFile(csv,'hermes-'+$.datepicker.formatDate( "yymmdd", new Date())+'.csv','text/csv')

    });

}

function setup_hermes_actions() {
    if ($('body.adminorders').length>0) {
        if ($('span.panel-heading-action #desc-order-new').length>0) {
            $('span.panel-heading-action').prepend(
'<a class="list-toolbar-btn" style="width:55px;padding:14px 5px;" href="javascript:get_hermes();">'+
'<span title="" data-toggle="tooltip" class="label-tooltip" data-original-title="Download CSV for Hermes" data-html="true" data-placement="top">'+
'HERMES</span></a>')

        }
    }
}

function get_dhl(ho=0) {
    //const url = 'https://www.gellifique.co.uk/apipy/DHL/';
    let url = 'https://www.gellifique.co.uk/pyadmin734r04xdw/api/v1/dhl/list/';
    if (ho) {
        url += 'h/'
    }
    else {
        url += 'o/'
    }

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

function setup_dhl_actions() {
    if ($('body.adminorders').length>0) {
        if ($('span.panel-heading-action #desc-order-new').length>0) {
            $('span.panel-heading-action').prepend(
'<a class="list-toolbar-btn" style="width:55px;padding:14px 5px;" href="javascript:get_dhl(0);">'+
'<span title="" data-toggle="tooltip" class="label-tooltip" data-original-title="Download CSV for DHL" data-html="true" data-placement="top">'+
'DHL Office</span></a>' + 
'<a class="list-toolbar-btn" style="width:55px;padding:14px 5px;" href="javascript:get_dhl(1);">'+
'<span title="" data-toggle="tooltip" class="label-tooltip" data-original-title="Download CSV for DHL" data-html="true" data-placement="top">'+
'DHL Home</span></a>')


        }
    }
}

function setup_ups_button() {
    if ($('#desc-order-partial_refund').length>0) {
        $('#desc-order-partial_refund').parent().append('&nbsp;<span class="btn btn-default"><select id="select-ups"><option>UPS</option><option>Ship Package</option><option>Print Label</option></span>')    

        $('#select-ups').change(function(){
            if ($('#select-ups').val()=='Ship Package') {
                if (confirm("Ship this order?")) {
                    do_ups(id_order)
                    if (confirm("Print label?"+" https://www.gellifique.co.uk/pyadmin734r04xdw/media/UPS/"+id_order+".pdf")) {
                        console.log("https://www.gellifique.co.uk/pyadmin734r04xdw/media/UPS/"+id_order+".pdf")
                        downloadPDFFromFile("https://www.gellifique.co.uk/pyadmin734r04xdw/media/UPS/"+id_order+".pdf", "UPS-"+id_order)
                    }
                }
            }
            else if ($('#select-ups').val()=='Print Label') {
                //window.open("https://www.gellifique.co.uk/pyadmin734r04xdw/media/UPS/"+id_order+".pdf")
                do_ups_label(id_order)
                downloadPDFFromFile("https://www.gellifique.co.uk/pyadmin734r04xdw/media/UPS/"+id_order+".pdf", "UPS-"+id_order)
            }
            $('#select-ups').get(0).selectedIndex=0;
        });
    }
}

function do_ups(id_order) {
    console.log('ajax')
    let url = 'https://www.gellifique.co.uk/pyadmin734r04xdw/api/v1/dhl/ups/action/';
    $.ajax({
      method: "post",
      async: false,
      data: {"id_order": id_order},  
      dataType: "json",
      url: url,
      headers: {"Authorization": "Token 6b246cc18769c6ec02dc20009649d5ae5903d454"},
      success: function(data) {
        console.log(data)
        console.log(data["data"]["ShipmentResponse"]["ShipmentResults"]["NegotiatedRateCharges"]["TotalChargesWithTaxes"]["MonetaryValue"])

        let sn = data["data"]["ShipmentResponse"]["ShipmentResults"]["ShipmentIdentificationNumber"]
        let price = data["data"]["ShipmentResponse"]["ShipmentResults"]["NegotiatedRateCharges"]["TotalChargesWithTaxes"]["MonetaryValue"]

        alert("Shipment "+sn+" successfully created. Total price is £"+price)

    }});

}

function do_ups_label(id_order) {
    console.log('ajax')
    let url = 'https://www.gellifique.co.uk/pyadmin734r04xdw/api/v1/dhl/ups/label/';
    $.ajax({
      method: "post",
      async: false,
      data: {"id_order": id_order},  
      dataType: "json",
      url: url,
      headers: {"Authorization": "Token 6b246cc18769c6ec02dc20009649d5ae5903d454"},
      success: function(data) {
        console.log(data)
        console.log(data["data"]["LabelRecoveryResponse"]["LabelResults"])

        let sn = data["data"]["LabelRecoveryResponse"]["LabelResults"]["ShipmentIdentificationNumber"]

        //alert("Shipment "+sn+" successfully retrieved.")

    }});

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
                '<option value="reference">Reference</option>'+
                '<option value="name-1">Name (en)</option>'+
                '<option value="name-2">Name (es)</option>'+
                '<option value="price">Price ex VAT</option>'+
                '</select>'+
                '<label>Search:</label> <input class="form-control" type="text" name="search" id="bulk-search" value="" />'+
                '<label>Replace:</label> <input class="form-control" type="text" name="replace" id="bulk-replace" value="" />'+
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

        $('#bulk_update_modal .btn-primary').click(function(){
            do_bulk_update();

        });
    }
}

function process_barcode(code) {
    console.log(code)
    $('#product').val('')
    $('#product').val(code)
    $('#product').focus()
    e = $.Event('keydown')
    e.which = e.keyCode = 9;
    e.originalEvent = e;
    $('#product').trigger(e);

    //setTimeout( function() {$('#submitAddProduct').click()}, 500);

}
var code='';
function setup_add_order_by_barcode() {
    if ($('body.adminorders').length>0 && $('#customer_part').length>0) {
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