const { json, request } = require("express");
const UserModel = require("../models/user-model");
const OrderCandidatesModel = require("../models/order-candidates");
const OrderQueueModel = require("../models/orders-queue");

const jwt = require("jsonwebtoken");
const tokenService = require("./token-service");
const ApiError = require("../exceptions/api-error");
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

  async addOrderQueue(
    token,
    orderId,
    orderType,
    orderInformation,
    clientId = null
  ) {
    const accessToken = token.split(" ")[1];
    if (accessToken != "null") {
      const userData = tokenService.validateAccessToken(accessToken);
      const user = await UserModel.findById(userData.id);
      if (!user) {
        throw ApiError(400, "Invalid fields");
      }
      const userId = user.id;
      // додаємо в чергу вісх замовлень
      const payment = await OrderQueueModel.create({
        userId: userId,
        orderId: orderId,
        orderType: orderType,
        orderInformation: orderInformation,
        createdAt: new Date().getTime(),
      });

      // додаєсо в базу запису останніх замовлень клаєнта
      // перевіряємо чи є такий запис в базі з айдішніком
      let existingItem = await OrderCandidatesModel.findOne({ userId: userId });
      if (existingItem) {
        let orderModel = {
          orderId: orderId,
          orderType: orderType,
          orderInformation: orderInformation,
        };
        existingItem.userOrder = orderModel;
        await existingItem.save();
      } else {
        let orderModel = {
          orderId: orderId,
          orderType: orderType,
          orderInformation: orderInformation,
        };
        await OrderCandidatesModel.create({
          userId: userId,
          userOrder: orderModel,
        });
      }

      return 0;
    } else {
      if (!clientId) {
        throw ApiError.BadRequest(502, "Try to reload the page and try letter");
      }
      const payment = await OrderQueueModel.create({
        userId: clientId,
        orderId: orderId,
        orderType: orderType,
        orderInformation: orderInformation,
        createdAt: new Date().getTime(),
      });

      // додаєсо в базу запису останніх замовлень клаєнта
      // перевіряємо чи є такий запис в базі з айдішніком
      let existingItem = await OrderCandidatesModel.findOne({
        userId: clientId,
      });
      if (existingItem) {
        let orderModel = {
          orderId: orderId,
          orderType: orderType,
          orderInformation: orderInformation,
        };
        existingItem.userOrder = orderModel;
        await existingItem.save();
      } else {
        let orderModel = {
          orderId: orderId,
          orderType: orderType,
          orderInformation: orderInformation,
        };
        await OrderCandidatesModel.create({
          userId: clientId,
          userOrder: orderModel,
        });
      }

      return 1;
    }
  }
}

module.exports = new PaymentService();
