<?php
/**
*  @author    vallka
*  @copyright 2007-2022 vallka
*  @license   http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/




class AdminPrintDeliverySlipsController extends ModuleAdminController
{
    private $write_log = 1;

    public function __construct()
    {
        parent::__construct();
        if ($this->write_log) {
            PrestaShopLogger::addLog('AdminPrintDeliverySlipsController:'.Tools::getValue('ids').':'.Tools::getValue('n'), 1, null, 'ProductBarcodes', null, true);
        }

        $this->postProcess();

        die;
    }

    public function postProcess()
    {

        $ids = Tools::getValue('ids');
        $ids = explode(',', $ids);
        $this->processGenerateOrderSlipsPDF($ids);

    }

    public static function getOrderSlips($order_ids)
    {
        //print_r($order_ids);
        $order_invoice_list = Db::getInstance()->executeS('SELECT * FROM `' . _DB_PREFIX_ . 'order_invoice` WHERE `id_order` in (' . $order_ids . ') ORDER BY `id_order` ');
        return ObjectModel::hydrateCollection('OrderInvoice', $order_invoice_list);
    }


    function processGenerateOrderSlipsPDF($id_order_slips_list)
    {


        $order_slips = $this->getOrderSlips(implode(',',$id_order_slips_list));

        if (empty($order_slips)) {
            throw new PrestaShopException('No order slips found');
        }        
        $pdf = new PDF($order_slips, PDF::TEMPLATE_DELIVERY_SLIP, Context::getContext()->smarty);
        $pdf->render();
    }
}
