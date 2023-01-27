var old_window_onload = window.onload;
var tracking_link = '';

window.onload = function(e){ 
    // just in case
    if (old_window_onload)
        old_window_onload();

    //console.log("window.onload",e); 
    //alert('myadminextra:'+$('h1').text())
    setup_tracking_info_bo()
    setup_bulk_actions()
    setup_hermes_actions()
    //setup_ups_button()
    setup_dhl_button()
    setup_add_order_by_barcode()

    setup_product_list()
    setup_transcopy_actions()

    const email = $('.customer-personal-informations-card a[href*=mailto]').text().trim();
    //$('.customer-private-note-card h3').append(' - <a target="_blank" href="https://dev.gellifique.co.uk/pyadmin734r04xdw/prestashop/customer-cert/'+email+'/">View Certificates</a>');
    $('.customer-private-note-card h3').append(' - <a target="_blank" href="https://app.gellifique.co.uk/prestashop/customer-cert/'+email+'/">View Certificates</a>');
}

function setup_tracking_info_bo() {
    const tracking_id = '.js-update-shipping-btn';

    if ($(tracking_id).length>0) {
        const nu = $(tracking_id).parent().prev().text().trim()
        let text = nu;

        if (nu.match(/^P2G\d+$/i)) {
            let link='https://www.parcel2go.com/tracking/' + nu;
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
            tracking_link = link;
        }
        else if (nu.match(/^1Z\w+$/i)) {
            let link='https://www.ups.com/track?loc=en_GB&tracknum='+nu+'&requester=ST/trackdetails';
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
            tracking_link = link;
        }
        else if (nu.match(/^DPD\d+$/i)) {
            let link='https://www.dpdlocal-online.co.uk/tracking/' + nu;
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
            tracking_link = link;
        }
        else if (nu.match(/^DHL:\d+$/i)) {
            let link='https://www.dhl.co.uk/en/express/tracking.html?AWB=' + nu.substr(4);
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
            tracking_link = link;
        }
        else if (nu.match(/^\d{10}$/)) {
            let link='https://www.dhl.co.uk/en/express/tracking.html?AWB=' + nu;
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
            tracking_link = link;
        }
        else if (nu.match(/^\d{16}$/)) {
            let link='https://new.myhermes.co.uk/track.html#/parcel/' + nu;
            text = '<a href="'+link+'" target="_blank">' + nu + '</a>';
            tracking_link = link;
        }
        else {
            return;
        }

        $(tracking_id).parent().prev().html(text);
    }
}


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

    if (w=='price' || w=='cost-price' || w=='weight' || w=='spec-price' || w=='feature' || w=='category') {
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
            "shop_context": shop_context
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
    a.target = '_blank';
  
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

var ups_error=null;

function setup_ups_button() {
    if ($('body.adminorders').length>0 && $('#update_order_status_action_btn').length>0) {
        $('#update_order_status_action_btn').parent().append('&nbsp;<span class="btn btn-default"><select id="select-ups"><option>UPS</option><option>Ship Package</option><option>Print Label</option></select></span>')
        if (tracking_link) {
            $('#select-ups').append('<option>Track</option>');
        }

        const id_order = $('#order-view-page').attr('data-order-title').match(/(\d+)/)[0];

        $('#select-ups').change(function(){
            if ($('#select-ups').val()=='Ship Package') {
                if (confirm("Ship this order?")) {
   		            ups_error=null;
                    do_ups(id_order)
                    if (!ups_error) {
                        if (confirm("Print label?"+" https://app.gellifique.co.uk/media/UPS/"+id_order+".pdf")) {
                            //console.log("https://dev.gellifique.co.uk/pyadmin734r04xdw/media/UPS/"+id_order+".pdf")
                            downloadPDFFromFile("https://app.gellifique.co.uk/media/UPS/"+id_order+".pdf", "UPS-"+id_order)
                        }
                    }
                }
            }
            else if ($('#select-ups').val()=='Print Label') {
		        ups_error=null;
                do_ups_label(id_order)
                if (!ups_error) {
                  //downloadPDFFromFile("https://dev.gellifique.co.uk/pyadmin734r04xdw/media/UPS/"+id_order+".pdf", "UPS-"+id_order)
                  downloadPDFFromFile("https://app.gellifique.co.uk/media/UPS/"+id_order+".pdf", "UPS-"+id_order)
                }
            }
            else if ($('#select-ups').val()=='Track' && tracking_link) {
                window.open(tracking_link, '_blank');
            }
            $('#select-ups').get(0).selectedIndex=0;
        });
    }
}

function do_ups(id_order) {
    console.log('ajax')
    //let url = 'https://dev.gellifique.co.uk/pyadmin734r04xdw/api/v1/dhl/ups/action/';
    let url = 'https://app.gellifique.co.uk/api/v1/ups/action/';
    $.ajax({
      method: "post",
      async: false,
      data: {"id_order": id_order},  
      dataType: "json",
      url: url,
      headers: {"Authorization": "Token 6b246cc18769c6ec02dc20009649d5ae5903d454"},
      success: function(data) {
        console.log(data)
        if (data['status']=='Error') {
          alert('Error: '+data['message'])
          ups_error = data['message']
        }
        else {
          console.log(data["data"]["ShipmentResponse"]["ShipmentResults"]["NegotiatedRateCharges"]["TotalChargesWithTaxes"]["MonetaryValue"])

          let sn = data["data"]["ShipmentResponse"]["ShipmentResults"]["ShipmentIdentificationNumber"]
          let price = data["data"]["ShipmentResponse"]["ShipmentResults"]["NegotiatedRateCharges"]["TotalChargesWithTaxes"]["MonetaryValue"]

          alert("Shipment "+sn+" successfully created. Total price is £"+price)
        }
      },
      error: function(data) {
        console.log('ERROR')
        console.log(data)
        alert('ERROR')
        ups_error = 'ERROR'
      }
   });

}

function do_ups_label(id_order) {
    console.log('ajax')
    //let url = 'https://dev.gellifique.co.uk/pyadmin734r04xdw/api/v1/dhl/ups/label/';
    let url = 'https://app.gellifique.co.uk/api/v1/ups/label/';
    $.ajax({
      method: "post",
      async: false,
      data: {"id_order": id_order},  
      dataType: "json",
      url: url,
      headers: {"Authorization": "Token 6b246cc18769c6ec02dc20009649d5ae5903d454"},
      success: function(data) {
        console.log(data)
        if (data['status']=='Error') {
          alert('Error: '+data['message'])
          ups_error = data['message']
        }
        else {
          console.log(data["data"]["LabelRecoveryResponse"]["LabelResults"])
          //let sn = data["data"]["LabelRecoveryResponse"]["LabelResults"]["ShipmentIdentificationNumber"]
          //alert("Shipment "+sn+" successfully retrieved.")
        }

    }});

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
            if (w=='price' || w=='cost-price' || w=='weight' || w=='spec-price' || w=='feature' || w=='category') {
                $('#bulk-search').prop('disabled',true);
            }
            else {
                $('#bulk-search').prop('disabled',false);

            }

        });

        $('#bulk_update_modal .btn-primary').click(function(){
            do_bulk_update();

        });
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

function setup_product_list() {
    if ($('#product_catalog_list table.product').length>0) {
        console.log('****Setup Product List');
        
        let ids = [];
        $('#product_catalog_list table.product tbody tr').each(function () {
            //console.log($(this).attr('data-product-id'));
            ids[ids.length] = $(this).attr('data-product-id');
        })

        let token = 'P7PBB7VK2Z5NZLQ27LRE314I3XMT7R65';
        let host = 'www.gellifique.co.uk';
    
        if (window.location.hostname.indexOf('.eu')>=0 || window.location.hostname.indexOf('eu.')>=0) {
            token = 'GDMMH7YNA6KYW51J5CZWVCFT62J7R34W';
            host = 'www.gellifique.eu';
        }

        let url = 'https://'+token+'@'+host+'/api/products/?output_format=JSON&display=[id,name]&filter[id]=['+ids.join('|')+']';
        $.ajax({
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

    }
}

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
                    let url = 'https://'+host+'/api/products/'+$('#form_id_product').val()+'/?ws_key='+token+'&output_format=JSON&display=[id,name,reference,description_short,description]';

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