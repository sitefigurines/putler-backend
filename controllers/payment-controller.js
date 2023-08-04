const ApiError = require("../exceptions/api-error");
const PaymentModel = require("../models/paymentCallback-model");
const PaymentService = require("../service/payment-service");
const LiqPay = require("../libs/liqpay");
const liqpay = new LiqPay(
  "sandbox_i39877007046",
  "sandbox_acYZpZa1IwUAYkRGr6jFjKKVaOaJTx4T9jvcco8V"
);

class PaymentControler {
  async paymentStatus(req, res, next) {
    try {
      const { id } = req.body;
      liqpay.api(
        "request",
        {
          action: "status",
          version: "3",
          order_id: id,
        },
        function result(json) {
          return res.json(json.status);
        }
      );
    } catch (e) {
      next(e);
    }
  }

  async createForm(req, res, next) {
    try {
      const {
        action,
        amount,
        currency,
        description,
        order_id,
        version,
        server_url,
      } = req.body;
      let form = await PaymentService.createForm(
        action,
        amount,
        currency,
        description,
        order_id,
        version,
        server_url
      );
      return res.json(form);
    } catch (e) {
      next(e);
    }
  }

  async saveCallback(req, res, next) {
    try {
      const ReqData = await req.body;
      const payment = await PaymentModel.create({
        paymentData: ReqData,
      });
      console.log(ReqData);
      return res.json(payment);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new PaymentControler();
