const { json, request } = require("express");
const UserModel = require("../models/user-model");
const LiqPay = require("../libs/liqpay");
const liqpay = new LiqPay(
  "sandbox_i39877007046",
  "sandbox_acYZpZa1IwUAYkRGr6jFjKKVaOaJTx4T9jvcco8V"
);

class PaymentService {
  async createForm(
    action,
    amount,
    currency,
    description,
    order_id,
    version,
    server_url
  ) {
    const html = liqpay.cnb_form({
      action: action,
      amount: amount,
      currency: currency,
      description: description,
      order_id: order_id,
      version: version,
      server_url: server_url,
    });

    return html;
  }
}

module.exports = new PaymentService();
