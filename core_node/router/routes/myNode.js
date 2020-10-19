/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es8 */
"use strict";
var express = require("express");

module.exports = function () {
	var app = express.Router();

	//Hello Router
	app.get("/", (req, res) => {
		return res.type("text/plain").status(200).send("Hello World Node.js");
	});
	//Simple Database Select - In-line Callbacks
	//Example1 handler
	app.get("/example1", (req, res) => {
		let client = req.db;
		client.prepare(
			`SELECT "PurchaseOrderId" 
		                   FROM "PO.HeaderView"`,
			(err, statement) => {
				if (err) {
					return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				}
				statement.exec([],
					(err, results) => {
						if (err) {
							return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
						} else {
							var result = JSON.stringify({
								Objects: results
							});
							return res.type("application/json").status(200).send(result);
						}
					});
				return null;
			});
		return null;
	});

	//Simple Database Update - In-line Callbacks
	//Example1 handler
	app.get("/example3", (req, res) => {
		//var body = $.request.body.asString();
		//var oData = JSON.parse(body)
		var oData = {
			"currency": "EUR",
			"po": "300000000"
		};
		let client = req.db;
		client.prepare(
			'UPDATE "PO.Header" SET CURRENCY = ? WHERE PURCHASEORDERID = ?',
			(err, statement) => {
				if (err) {
					return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				}
				statement.exec([oData.currency, oData.po],
					(err, results) => {
						if (err) {
							return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
						} else {
							//						client.commit(),
							var result = JSON.stringify({
								Objects: results
							});
							return res.type("application/json").status(200).send(result);
						}
					});
				return null;
			});
		return null;
	});

	var async = require("async");
	//Simple Database Select Via Client Wrapper/Middelware - Async Waterfall
	app.get("/example2", (req, res) => {
		let client = req.db;
		async.waterfall([
			function prepare(callback) {
				client.prepare(`SELECT SESSION_USER, CURRENT_SCHEMA
											FROM "DUMMY"`,
					(err, statement) => {
						callback(null, err, statement);
					});
			},

			function execute(err, statement, callback) {
				statement.exec([], (execErr, results) => {
					callback(null, execErr, results);
				});
			},
			function response(err, results, callback) {
				if (err) {
					res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				} else {
					var result = JSON.stringify({
						Objects: results
					});
					res.type("application/json").status(200).send(result);
				}
				return callback();
			}
		]);
	});

	//Simple Database Select Via Client Wrapper/Middelware - Promises
	app.get("/promises", (req, res) => {
		const dbClass = require(global.__base + "utils/dbPromises");
		let db = new dbClass(req.db);
		db.preparePromisified(`SELECT SESSION_USER, CURRENT_SCHEMA 
				            	 FROM "DUMMY"`)
			.then(statement => {
				db.statementExecPromisified(statement, [])
					.then(results => {
						let result = JSON.stringify({
							Objects: results
						});
						return res.type("application/json").status(200).send(result);
					})
					.catch(err => {
						return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
					});
			})
			.catch(err => {
				return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
			});
	});

	//	Simple Database Select Via Client Wrapper/Middelware - Await
	app.get("/await", async(req, res) => {
		var oData = {
			"currency": "LJP",
			"po": "300000000"
		};
		const dbClass = require(global.__base + "utils/dbPromises");
		let db = new dbClass(req.db);
		try {
			const statement = await db.preparePromisified('UPDATE "PO.Header" SET CURRENCY = ? WHERE PURCHASEORDERID = ?');
			const results = await db.statementExecPromisified(statement, ["AAA", oData.po]);

			const statement1 = await db.preparePromisified('UPDATE "PO.Header1" SET CURRENCY = ? WHERE PURCHASEORDERID = ?');
			const results1 = await db.statementExecPromisified(statement1, [oData.currency, oData.po]);
			db.client.setAutoCommit(true);
			let result = JSON.stringify({
				Objects: results
			});
			return res.type("application/json").status(200).send(result);
		} catch (e) {
			db.client.rollback();
			db.client.setAutoCommit(true);
			return res.type("text/plain").status(500).send(`ERROR: ${e.toString()}`);
		}
	});

	//Simple Database Call Stored Procedure
	app.get("/procedures", (req, res) => {
		var client = req.db;
		var hdbext = require("@sap/hdbext");
		//(client, Schema, Procedure, callback)
		hdbext.loadProcedure(client, null, "getPOItemsSQL", (err, sp) => {
			if (err) {
				res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				return;
			}
			//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
			sp({}, (err, parameters, results) => {
				if (err) {
					res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				}
				var result = JSON.stringify({
					EX_TOP_3_EMP_PO_COMBINED_CNT: results
				});
				res.type("application/json").status(200).send(result);
			});
		});
	});

	//Database Call Stored Procedure With Inputs
	app.get("/procedures2/:in_id?", (req, res) => {
		var client = req.db;
		var hdbext = require("@sap/hdbext");
		var in_id = req.params.in_id;
		var inputParams = "";
		if (typeof in_id === "undefined" || in_id === null) {
			inputParams = {};
		} else {
			inputParams = {
				IN_ID: in_id
			};
		}
		//(cleint, Schema, Procedure, callback)
		hdbext.loadProcedure(client, null, "getHeader", (err, sp) => {
			if (err) {
				res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				return;
			}
			//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
			sp(inputParams, (err, parameters, results) => {
				if (err) {
					res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
				}
				var result = JSON.stringify({
					EX_BP_ADDRESSES: results
				});
				res.type("application/json").status(200).send(result);
			});
		});
	});

	//Call 2 Database Stored Procedures in Parallel
	app.get("/proceduresParallel/", (req, res) => {
		var client = req.db;
		var hdbext = require("@sap/hdbext");
		var inputParams = {
			IN_ID: "500000000"
		};
		var result = {};
		async.parallel([

			function (cb) {
				hdbext.loadProcedure(client, null, "getHeader", (err, sp) => {
					if (err) {
						cb(err);
						return;
					}
					//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
					sp(inputParams, (err, parameters, results) => {
						result.EX_TOP_3_EMP_PO_COMBINED_CNT = results;
						cb();
					});
				});

			},
			function (cb) {
				//(client, Schema, Procedure, callback)            		
				hdbext.loadProcedure(client, null, "getPOItemsSQL", (err, sp) => {
					if (err) {
						cb(err);
						return;
					}
					//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
					sp(inputParams, (err, parameters, results) => {
						result.EX_BP_ADDRESSES = results;
						cb();
					});
				});
			}
		], (err) => {
			if (err) {
				res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
			} else {
				res.type("application/json").status(200).send(JSON.stringify(result));
			}
		});
	});

	//Call 2 Db calls in Parallel: Committ work in single statement at time
	app.get("/dbParallel/", (req, res) => {
		var client = req.db;
		var hdbext = require("@sap/hdbext");
		// var inputParams = {
		// 	IN_ID: "500000000"
		// };
		var result = {};
		async.parallel([

			function (cb) {
				client.prepare('UPDATE "PO.Header" SET CURRENCY = ? WHERE PURCHASEORDERID = ?',
					(err, statement) => {
						if (err) {
							cb(err);
							return;
						}
						statement.exec(["LDF", "300000000"], (execErr, results) => {
							result.EX_BP_ADDRESSES = results;
							cb();
						});
					});
			},
			function (cb) {
				client.prepare('UPDATE "PO.Header123" SET CURRENCY = ? WHERE PURCHASEORDERID = ?',
					(err, statement) => {
						if (err) {
							cb(err);
							return;
						}
						statement.exec(["ABC", "300000000"], (execErr, results) => {
							result.EX_BP_INFO1 = results;
							cb();
						});
					});
			}
		], (err) => {
			if (err) {
				client.rollback();
				res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
			} else {
				res.type("application/json").status(200).send(JSON.stringify(result));
			}
		});
	});
	return app;
};