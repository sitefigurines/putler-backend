const ApiError = require("../exceptions/api-error");
const PaymentModel = require("../models/paymentCallback-model");
const OrderQueueModel = require("../models/orders-queue");
const PaymentService = require("../service/payment-service");
const LiqPay = require("../libs/liqpay");
const userModel = require("../models/user-model");
const request = require("request");

class PaymentControler {
  async paymentStatus(req, res, next) {
    try {
      // request.post(
      //   {
      //     url: "https://www.portmone.com.ua/gateway",
      //     form: {
      //       method: "result",
      //       params: {
      //         data: {
      //           login: "wdishop",
      //           password: "wdi451",
      //           payeeId: "1185",
      //           status: "",
      //           startDate: "30.03.2023",
      //           endDate: "31.03.2023",
      //           shopOrderNumber: "2001223762",
      //         },
      //       },
      //       id: "1",
      //     },
      //   },
      //   (err, response, body) => {
      //     if (err) return res.status(500).send({ message: err });
      //     return res.send(body);
      //   }
      // );
      // const { orderId } = req.body;
      // if (orderId) {
      // } else {
      //   let allOrders = await OrderQueueModel.find();
      //   console.log(allOrders[0]._id);
      //   let user = await userModel.findOne({ _id: allOrders[0].userId });
      //   return res.json(user);
      // }
      // let responce = await axios.post("https://www.portmone.com.ua/gateway/", {
      //   method: "result",
      //   params: {
      //     data: {
      //       login: "wdishop",
      //       password: "wdi451",
      //       payeeId: "1185",
      //       status: "",
      //       startDate: "30.03.2023",
      //       endDate: "31.03.2023",
      //       shopOrderNumber: "2001223762",
      //     },
      //   },
      //   id: "1",
      // });
      // paymentStatus
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

  async addOrderQueue(req, res, next) {
    try {
      const userId = req.user.id;
      const { orderId, orderInformation } = await req.body;
      const payment = await OrderQueueModel.create({
        userId: userId,
        orderId: orderId,
        orderInformation: orderInformation,
      });
      return res.json(payment);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new PaymentControler();
