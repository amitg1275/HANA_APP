/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";

let conn = $.hdb.getConnection();
let query =
	`SELECT  "POHeader.PURCHASEORDERID" as "PurchaseOrderItemId",
             PRODUCT as "ProductID",
             GROSSAMOUNT as "Amount"
             FROM "PurchaseOrder.Item1" `;
let rs = conn.executeQuery(query);

let body = "";
for(let item of rs){
   if(item.Amount >= 500){
	body += item.PurchaseOrderItemId + "\t" +
			item.ProductID + "\t" + item.Amount + "\n";
   }
}
$.response.setBody(body);
$.response.contentType = "application/vnd.ms-excel; charset=utf-16le";
$.response.headers.set("Content-Disposition",
		"attachment; filename=Excel.xls");
$.response.status = $.net.http.OK;