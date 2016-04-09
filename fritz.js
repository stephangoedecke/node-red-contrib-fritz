var tr064lib = require("tr-064");
var client = new tr064lib.TR064();
var util = require("util");

module.exports = function(RED) {

	RED.httpAdmin.get('/fritzbox/services', function(req, res, next) {
		var url = req.query.url;
		client.initTR064Device(req.query.url, 49000, function (err, device) {
		    if (!err) {
					var services = Object.keys(device.services);
		      res.end(JSON.stringify(services));
		    }
		});
	});

	RED.httpAdmin.get('/fritzbox/actions', function(req, res, next) {
		var url = req.query.url;
		var service = req.query.service;
		client.initTR064Device(req.query.url, 49000, function (err, device) {
			if(!err && device.services[service]) {
				var actions = device.services[service].meta.actionsInfo;
				res.end(JSON.stringify(actions));
			} else {
				res.end(JSON.stringify([]));
			}
		});
	});

	function FritzboxConfig(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		node.host = n.host;
		node.device = null;

		if(node.host) {
			client.initTR064Device(node.host, 49000, function(err, device) {
				if(err) {
					node.error("Could not connect to fritzbox");
					return;
				} else {
					node.device = device;
					node.device.login(node.credentials.username, node.credentials.password);
				}
			});
		}

	}
	RED.nodes.registerType("fritzbox-config", FritzboxConfig, {
		credentials: {
			username: {type: "text"},
			password: {type: "password"}
		}
	});


	function FritzboxIn(n) {
		RED.nodes.createNode(this,n);
		var node = this;
		node.service = n.service;
		node.action = n.action;
		node.config = RED.nodes.getNode(n.device);

		node.on('input', function(msg) {
			if(node.config.device) {
				node.config.device.services[node.service].actions[node.action](msg.payload, function(err, result) {
					if(err) {
						node.warn(err);
						return;
					} else {
						msg.payload = result;
						node.send(msg);
					}
				});
			} else {
				node.error("Could not load configuration");
			}
		});
	}
	RED.nodes.registerType("fritzbox-in", FritzboxIn);
};
